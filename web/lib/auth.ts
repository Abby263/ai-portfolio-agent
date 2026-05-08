import "server-only";

export const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/**
 * Returns the GitHub username (lowercased) of the currently signed-in user,
 * or null if no one is signed in / Clerk isn't configured.
 *
 * Reads the GitHub username from Clerk's externalAccounts so it works for
 * users who signed in via the GitHub social connection.
 */
export async function getSignedInGitHubUsername(): Promise<string | null> {
  if (!CLERK_ENABLED) return null;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    if (!user) return null;
    const gh = user.externalAccounts?.find(
      (a) => a.provider === "github",
    );
    return gh?.username?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}
