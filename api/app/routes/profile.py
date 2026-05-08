import base64
import re
import zipfile
from io import BytesIO
from xml.etree import ElementTree

from fastapi import APIRouter, Header, HTTPException
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


def _incoming_patch(body: BuildProfileRequest) -> dict[str, str]:
    """Only update fields the client intentionally supplied."""
    patch: dict[str, str] = {}
    if "resume_text" in body.model_fields_set and body.resume_text:
        patch["resume_text"] = body.resume_text
    return patch


async def _build_with_customization_patch(
    username: str,
    patch: dict[str, str],
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
        if cached is not None:
            return cached
        customizations = await get_customizations(username)
    else:
        customizations = {}
    try:
        profile = await build_profile(
            username,
            resume_text=customizations.get("resume_text"),
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


@router.post("/profile/{username}/resume", response_model=Profile)
async def upload_resume_endpoint(
    username: str,
    body: UploadResumeRequest,
    authorization: str | None = Header(default=None),
) -> Profile:
    resume_text = _extract_resume_text(body)
    return await _build_with_customization_patch(
        username,
        {"resume_text": resume_text},
        authorization,
    )
