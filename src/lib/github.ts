import mongoose from "mongoose";
import { TeamMember, Resource, Project } from "./models";

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

export async function setupGitHubRepository(projectId: string, projectTitle: string): Promise<string | null> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    console.warn("GITHUB_PAT is missing in environment. Skipping automatic GitHub setup.");
    return null;
  }

  try {
    // 1. Get authenticated GitHub user details
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${pat}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch GitHub user details: ${userRes.statusText}`);
    }

    const userData = await userRes.json();
    const ownerName = userData.login;
    if (!ownerName) {
      throw new Error("Could not retrieve GitHub login name from PAT.");
    }

    // 2. Format a safe, lowercase, alphanumeric repository name
    let repoName = projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!repoName) {
      repoName = `project-${projectId.slice(-6)}`;
    }

    // 3. Create the private repository
    let createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `token ${pat}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `Shared repository for project: ${projectTitle}`,
        private: true,
        auto_init: true,
      }),
    });

    // If repository name already exists, append a unique suffix
    if (createRes.status === 422) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      repoName = `${repoName}-${suffix}`;
      console.log(`Repository name already exists, retrying with unique suffix: ${repoName}`);

      createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          "Authorization": `token ${pat}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          description: `Shared repository for project: ${projectTitle}`,
          private: true,
          auto_init: true,
        }),
      });
    }

    if (!createRes.ok) {
      throw new Error(`Failed to create repository: ${createRes.statusText}`);
    }

    const repoData = await createRes.json();
    const repoUrl = repoData.html_url;
    console.log(`Successfully created private GitHub repository: ${repoUrl}`);

    // 4. Retrieve the project document to find the owner ID
    const project = await Project.findById(projectId);
    const creatorId = project ? project.owner : null;

    // 5. Get all team members of this project
    const members = await TeamMember.find({ project: projectId }).populate("user", "username githubUrl");

    // 6. Invite members as collaborators
    for (const member of members) {
      const user = member.user as any;
      if (!user) continue;

      // Parse/extract the GitHub username from githubUrl or default to username
      let gitUsername = "";
      if (user.githubUrl) {
        const parts = user.githubUrl.split("/");
        const name = parts[parts.length - 1];
        if (name) gitUsername = name;
      }
      if (!gitUsername) {
        gitUsername = user.username;
      }

      // Do not invite the owner of the PAT (they are already the repo owner)
      if (gitUsername.toLowerCase() === ownerName.toLowerCase()) {
        continue;
      }

      console.log(`Inviting collaborator ${gitUsername} to repository ${ownerName}/${repoName}...`);
      try {
        const inviteRes = await fetch(
          `https://api.github.com/repos/${ownerName}/${repoName}/collaborators/${gitUsername}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `token ${pat}`,
              "Accept": "application/vnd.github.v3+json",
            },
            body: JSON.stringify({
              permission: "push",
            }),
          }
        );

        if (!inviteRes.ok) {
          console.warn(`Could not invite user ${gitUsername} to repository:`, inviteRes.statusText);
        }
      } catch (err) {
        console.error(`Error sending collaborator invite to ${gitUsername}:`, err);
      }
    }

    // 7. Automatically add the GitHub repository link to the Project's Resource Vault
    try {
      const resourceCreator = creatorId || (members[0]?.user?._id as mongoose.Types.ObjectId);
      if (resourceCreator) {
        await Resource.create({
          project: new mongoose.Types.ObjectId(projectId),
          creator: resourceCreator,
          title: "Project GitHub Repository",
          url: repoUrl,
          category: "GitHub",
        });
        console.log(`Successfully added GitHub link to Project Resource Vault: ${repoUrl}`);
      }
    } catch (err) {
      console.error("Failed to automatically add repository resource link to Resource Vault:", err);
    }

    return repoUrl;
  } catch (err) {
    console.error("Auto GitHub setup encountered an error:", err);
    return null;
  }
}
