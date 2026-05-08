import base64
import re
import zipfile
from io import BytesIO
from typing import Any
from xml.etree import ElementTree

from fastapi import APIRouter, Header, HTTPException, Response
from pydantic import BaseModel, Field

from ..agents.orchestrator import build_profile
from ..auth import authenticated_github_username, clerk_enabled
from ..models.profile import Profile
from ..storage import (
    get_customizations,
    get_profile_cache,
    kv_enabled,
    save_customizations,
    save_profile_cache,
)

router = APIRouter()

MAX_RESUME_BYTES = 4_000_000
MAX_RESUME_TEXT_CHARS = 200_000


class BuildProfileRequest(BaseModel):
    resume_text: str | None = Field(default=None, max_length=200_000)


class UploadResumeRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=240)
    content_type: str | None = Field(default=None, max_length=120)
    data_base64: str = Field(
        ...,
        max_length=6_000_000,
        description="Base64-encoded resume file. Supports PDF, DOCX, Markdown, and plain text.",
    )


def _incoming_patch(body: BuildProfileRequest) -> dict[str, Any]:
    """Only update fields the client intentionally supplied."""
    patch: dict[str, Any] = {}
    if "resume_text" in body.model_fields_set and body.resume_text:
        patch["resume_text"] = body.resume_text
        patch["resume_filename"] = "resume.txt"
        patch["resume_content_type"] = "text/plain; charset=utf-8"
        patch["resume_file_base64"] = None
    return patch


def _safe_resume_filename(value: str | None) -> str:
    filename = (value or "resume.txt").strip()
    filename = filename.replace("\\", "/").split("/")[-1]
    filename = re.sub(r"[^A-Za-z0-9._ -]", "_", filename).strip(" .")
    return filename or "resume.txt"


def _resume_content_type(value: str | None, filename: str) -> str:
    content_type = (value or "").strip().lower()
    if content_type:
        return content_type
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".docx"):
        return (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    if lower.endswith(".md"):
        return "text/markdown; charset=utf-8"
    return "text/plain; charset=utf-8"


def _has_uploaded_resume_file(customizations: dict[str, Any]) -> bool:
    return bool(customizations.get("resume_file_base64"))


def _uploaded_resume_content_type(customizations: dict[str, Any]) -> str | None:
    if not _has_uploaded_resume_file(customizations):
        return None
    filename = _safe_resume_filename(customizations.get("resume_filename"))
    return _resume_content_type(customizations.get("resume_content_type"), filename)


async def _build_with_customization_patch(
    username: str,
    patch: dict[str, Any],
    authorization: str | None,
) -> Profile:
    has_changes = bool(patch)

    requester = await authenticated_github_username(authorization)
    is_owner = requester is not None and requester == username.lower()

    # If KV is on and the caller has changes to save, require owner auth.
    if has_changes and kv_enabled():
        if not clerk_enabled():
            # Clerk not set up — accept but don't persist (session-only).
            customizations = patch
        else:
            if not authorization:
                raise HTTPException(
                    status_code=401,
                    detail="Sign in to save customizations.",
                )
            if not is_owner:
                raise HTTPException(
                    status_code=403,
                    detail="Only the profile owner can save customizations.",
                )
            customizations = await save_customizations(username, patch)
    elif kv_enabled():
        customizations = await get_customizations(username)
    else:
        customizations = patch

    try:
        profile = await build_profile(
            username,
            resume_text=customizations.get("resume_text"),
        )
        profile.resume_file_available = _has_uploaded_resume_file(customizations)
        profile.resume_file_content_type = _uploaded_resume_content_type(
            customizations
        )
        if kv_enabled():
            await save_profile_cache(username, profile)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


def _extract_text_from_docx(raw: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(raw)) as archive:
            xml = archive.read("word/document.xml")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Could not read DOCX resume. Upload a valid .docx file.",
        ) from e

    root = ElementTree.fromstring(xml)
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", namespace):
        text = "".join(
            node.text or "" for node in paragraph.findall(".//w:t", namespace)
        ).strip()
        if text:
            paragraphs.append(text)
    return "\n".join(paragraphs)


def _extract_text_from_pdf(raw: bytes) -> str:
    try:
        from pypdf import PdfReader
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="PDF resume parsing requires the pypdf dependency.",
        ) from e

    try:
        reader = PdfReader(BytesIO(raw))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Could not read PDF resume. Upload a text-based PDF, DOCX, Markdown, or plain-text file.",
        ) from e


def _extract_resume_text(body: UploadResumeRequest) -> str:
    try:
        raw = base64.b64decode(body.data_base64, validate=True)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Resume upload is not valid base64.",
        ) from e

    if len(raw) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Resume file is too large. Upload a file under 4 MB.",
        )

    filename = body.filename.lower()
    content_type = (body.content_type or "").lower()
    if filename.endswith(".pdf") or content_type == "application/pdf":
        text = _extract_text_from_pdf(raw)
    elif filename.endswith(".docx") or content_type.endswith(
        "officedocument.wordprocessingml.document"
    ):
        text = _extract_text_from_docx(raw)
    else:
        text = raw.decode("utf-8", errors="replace")

    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from this resume.",
        )
    if len(text) > MAX_RESUME_TEXT_CHARS:
        raise HTTPException(
            status_code=413,
            detail="Extracted resume text is too large. Keep it under 200,000 characters.",
        )
    return text


@router.get("/profile/{username}", response_model=Profile)
async def get_profile(username: str) -> Profile:
    if kv_enabled():
        cached = await get_profile_cache(username)
        customizations = await get_customizations(username)
        if cached is not None:
            cached.resume_file_available = _has_uploaded_resume_file(customizations)
            cached.resume_file_content_type = _uploaded_resume_content_type(
                customizations
            )
            return cached
    else:
        customizations = {}
    try:
        profile = await build_profile(
            username,
            resume_text=customizations.get("resume_text"),
        )
        profile.resume_file_available = _has_uploaded_resume_file(customizations)
        profile.resume_file_content_type = _uploaded_resume_content_type(
            customizations
        )
        if kv_enabled():
            await save_profile_cache(username, profile)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/profile/{username}", response_model=Profile)
async def build_profile_endpoint(
    username: str,
    body: BuildProfileRequest | None = None,
    authorization: str | None = Header(default=None),
) -> Profile:
    body = body or BuildProfileRequest()
    return await _build_with_customization_patch(
        username,
        _incoming_patch(body),
        authorization,
    )


@router.get("/profile/{username}/resume")
async def view_resume_endpoint(username: str) -> Response:
    if not kv_enabled():
        raise HTTPException(status_code=404, detail="Resume storage is not configured.")

    customizations = await get_customizations(username)
    filename = _safe_resume_filename(customizations.get("resume_filename"))
    file_base64 = customizations.get("resume_file_base64")

    if file_base64:
        try:
            raw = base64.b64decode(file_base64, validate=True)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail="Stored resume file is not readable.",
            ) from e

        return Response(
            content=raw,
            media_type=_resume_content_type(
                customizations.get("resume_content_type"),
                filename,
            ),
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "public, max-age=300",
            },
        )

    raise HTTPException(
        status_code=404,
        detail="Uploaded resume file is not available. Re-upload the PDF resume from Sources.",
    )


@router.post("/profile/{username}/resume", response_model=Profile)
async def upload_resume_endpoint(
    username: str,
    body: UploadResumeRequest,
    authorization: str | None = Header(default=None),
) -> Profile:
    resume_text = _extract_resume_text(body)
    return await _build_with_customization_patch(
        username,
        {
            "resume_text": resume_text,
            "resume_filename": _safe_resume_filename(body.filename),
            "resume_content_type": body.content_type or "",
            "resume_file_base64": body.data_base64,
        },
        authorization,
    )
