export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://ai-portfolio-agent-api.vercel.app";

export type Source = {
  connector: string;
  source_id: string;
  fetched_at: string;
};

export type Project = {
  name: string;
  description: string | null;
  repo_url: string | null;
  homepage: string | null;
  pinned: boolean;
  language: string | null;
  stars: number;
  topics: string[];
  highlights: string[];
  deployment_url: string | null;
  deployment_target: string | null;
  deployment_count: number;
  sources: Source[];
};

export type Experience = {
  company: string;
  role: string;
  start: string | null;
  end: string | null;
  location: string | null;
  summary: string | null;
  highlights: string[];
};

export type Education = {
  institution: string;
  degree: string | null;
  field: string | null;
  start: string | null;
  end: string | null;
};

export type Profile = {
  username: string;
  display_name: string | null;
  headline: string | null;
  tagline: string | null;
  bio: string | null;
  story: string | null;
  themes: string[];
  avatar_url: string | null;
  location: string | null;
  skills: string[];
  projects: Project[];
  experiences: Experience[];
  education: Education[];
  resume_summary: string | null;
  resume_file_available?: boolean;
  links: Record<string, string>;
  sources: Source[];
  generated_at: string;
};

export async function fetchProfile(username: string): Promise<Profile | null> {
  const res = await fetch(`${API_URL}/api/profile/${username}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch profile (${res.status})`);
  }
  return res.json();
}

export function resumeUrl(username: string): string {
  return `${API_URL}/api/profile/${encodeURIComponent(username)}/resume`;
}

export type BuildProfileInput = {
  resumeText?: string | null;
  authToken?: string | null;
};

function authHeaders(authToken?: string | null): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export async function buildProfile(
  username: string,
  input: BuildProfileInput = {},
): Promise<Profile> {
  const body: Record<string, string> = {};
  if (input.resumeText) body.resume_text = input.resumeText;

  const res = await fetch(`${API_URL}/api/profile/${username}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(input.authToken),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to build profile (${res.status}): ${detail}`);
  }
  return res.json();
}

export type UploadResumeInput = {
  file: File;
  authToken?: string | null;
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const [, base64] = value.split(",", 2);
      if (!base64) {
        reject(new Error("Could not read resume file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read resume file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadResume(
  username: string,
  input: UploadResumeInput,
): Promise<Profile> {
  const dataBase64 = await readFileAsBase64(input.file);
  const res = await fetch(`${API_URL}/api/profile/${username}/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(input.authToken),
    },
    body: JSON.stringify({
      filename: input.file.name,
      content_type: input.file.type || null,
      data_base64: dataBase64,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to upload resume (${res.status}): ${detail}`);
  }
  return res.json();
}

export type SuggestedAction = {
  label: string;
  description: string;
  kind:
    | "readme_update"
    | "pr_creation"
    | "case_study"
    | "linkedin_post"
    | "other";
};

export type CommandResponse = {
  answer: string;
  suggested_actions: SuggestedAction[];
};

export async function runCommand(
  username: string,
  command: string,
  profile?: Profile,
): Promise<CommandResponse> {
  const res = await fetch(`${API_URL}/api/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, command, profile: profile ?? null }),
  });
  if (!res.ok) {
    throw new Error(`Command failed (${res.status})`);
  }
  return res.json();
}

export type DraftReadmeResponse = {
  owner: string;
  repo: string;
  default_branch: string;
  file_path: string;
  current: string | null;
  current_sha: string | null;
  proposed: string;
  summary: string;
};

export async function draftReadme(
  owner: string,
  repo: string,
): Promise<DraftReadmeResponse> {
  const res = await fetch(`${API_URL}/api/actions/draft-readme`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, repo }),
  });
  if (!res.ok) {
    throw new Error(`Draft failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export type CreatePrResponse = {
  pr_url: string;
  pr_number: number;
  branch: string;
};

export type CreatePrInput = {
  owner: string;
  repo: string;
  branch: string;
  file_path: string;
  content: string;
  sha: string | null;
  commit_message: string;
  pr_title: string;
  pr_body: string;
  base?: string;
};

export async function createPr(input: CreatePrInput): Promise<CreatePrResponse> {
  const res = await fetch(`${API_URL}/api/actions/create-pr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`PR creation failed (${res.status}): ${detail}`);
  }
  return res.json();
}
