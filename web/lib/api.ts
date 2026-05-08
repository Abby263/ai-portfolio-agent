export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  language: string | null;
  stars: number;
  topics: string[];
  highlights: string[];
  sources: Source[];
};

export type Profile = {
  username: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  story: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string[];
  projects: Project[];
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
