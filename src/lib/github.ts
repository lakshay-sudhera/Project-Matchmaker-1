import mongoose from "mongoose";

/**
 * Scrapes public contribution count for a given username.
 */
export async function fetchGithubContributions(username: string): Promise<number> {
  if (!username) return 0;
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.error(`Failed to fetch contributions page for ${username}:`, res.statusText);
      return 0;
    }
    const html = await res.text();
    const match = html.match(/(\d[\d,]*)\s+contributions/i);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return 0;
  } catch (err) {
    console.error("Error scraping github contributions:", err);
    return 0;
  }
}

/**
 * Validates if the given GitHub access token has valid authentication.
 */
export async function checkGitHubConnection(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Error checking GitHub connection:", err);
    return false;
  }
}

/**
 * Creates a public repository under the authenticated user's account.
 */
export async function createRepository(
  accessToken: string,
  projectTitle: string,
  projectDescription: string
): Promise<{ name: string; url: string; owner: string; createdAt: Date }> {
  // 1. Get authenticated user login details
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      "Authorization": `token ${accessToken}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!userRes.ok) {
    throw new Error(`Failed to fetch GitHub profile. Status: ${userRes.statusText}`);
  }

  const userData = await userRes.json();
  const owner = userData.login;
  if (!owner) {
    throw new Error("Could not retrieve GitHub login name from access token.");
  }

  // 2. Format a safe, lowercase, alphanumeric repository name
  let repoName = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!repoName) {
    repoName = `project-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 3. Create the repository (public by default, with auto_init README)
  let createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      "Authorization": `token ${accessToken}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      description: projectDescription || `Shared repository for project: ${projectTitle}`,
      private: false, // Public repository by default
      auto_init: true,
    }),
  });

  // Handle repository name collision by appending a unique suffix
  if (createRes.status === 422) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    repoName = `${repoName}-${suffix}`;
    console.log(`Repository name already exists, retrying with unique suffix: ${repoName}`);

    createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `token ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: projectDescription || `Shared repository for project: ${projectTitle}`,
        private: false,
        auto_init: true,
      }),
    });
  }

  if (!createRes.ok) {
    const errorBody = await createRes.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to create repository: ${createRes.statusText}`);
  }

  const repoData = await createRes.json();
  return {
    name: repoData.name,
    url: repoData.html_url,
    owner: repoData.owner.login,
    createdAt: new Date(repoData.created_at || Date.now()),
  };
}

/**
 * Invites a collaborator to the specified repository with push permission.
 */
export async function addCollaborator(
  accessToken: string,
  owner: string,
  repo: string,
  username: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${accessToken}`,
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          permission: "push",
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.warn(`Could not invite user ${username} to repository:`, errorBody.message || res.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error sending collaborator invite to ${username}:`, err);
    return false;
  }
}
