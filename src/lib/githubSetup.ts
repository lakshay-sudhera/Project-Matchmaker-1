import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import { Project, User, TeamMember, Resource } from "./models";
import { createRepository, addCollaborator } from "./github";

/**
 * High-level orchestration function to set up a project's repository.
 * 1. Retrieves project owner details and verifies GitHub credentials.
 * 2. Creates a public GitHub repository under the owner's account.
 * 3. Automatically invites all accepted project team members.
 * 4. Saves repository details on the Project.
 * 5. Adds repository URL to the Project's Resource Vault.
 */
export async function setupProjectRepository(projectId: string): Promise<{ name: string; url: string; owner: string; createdAt: Date }> {
  await connectToDatabase();

  // 1. Get project
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  // 2. Get project owner with their private githubAccessToken
  const ownerUser = await User.findById(project.owner).select("+githubAccessToken");
  if (!ownerUser) {
    throw new Error("Project owner not found.");
  }

  // 3. Validate that the owner has GitHub repository permissions
  if (!ownerUser.githubAccessToken) {
    throw new Error("Please reconnect GitHub and allow repository access before activating this project.");
  }

  // 4. Create the repository using the owner's OAuth access token
  const repoInfo = await createRepository(
    ownerUser.githubAccessToken,
    project.title,
    project.description
  );

  // 5. Retrieve all accepted team members
  const members = await TeamMember.find({ project: projectId }).populate("user", "username githubUrl");

  // 6. Invite collaborators
  for (const member of members) {
    const memberUser = member.user as any;
    if (!memberUser) continue;

    let gitUsername = "";
    if (memberUser.githubUrl) {
      const parts = memberUser.githubUrl.split("/");
      const name = parts[parts.length - 1];
      if (name) gitUsername = name;
    }
    if (!gitUsername) {
      gitUsername = memberUser.username;
    }

    // Do not invite the owner (they own the repo and token already)
    if (gitUsername.toLowerCase() === repoInfo.owner.toLowerCase()) {
      continue;
    }

    console.log(`Inviting collaborator ${gitUsername} to repository ${repoInfo.owner}/${repoInfo.name}...`);
    try {
      await addCollaborator(
        ownerUser.githubAccessToken,
        repoInfo.owner,
        repoInfo.name,
        gitUsername
      );
    } catch (err) {
      console.error(`Collaborator invitation failed for ${gitUsername}:`, err);
    }
  }

  // 7. Save repository information on the project document
  project.githubRepo = {
    name: repoInfo.name,
    url: repoInfo.url,
    owner: repoInfo.owner,
    createdAt: repoInfo.createdAt,
  };
  await project.save();

  // 8. Add GitHub repository link to the Project's Resource Vault
  try {
    const resourceCreator = project.owner || (members[0]?.user?._id as mongoose.Types.ObjectId);
    if (resourceCreator) {
      await Resource.create({
        project: new mongoose.Types.ObjectId(projectId),
        creator: resourceCreator,
        title: "Project GitHub Repository",
        url: repoInfo.url,
        category: "GitHub",
      });
      console.log(`Successfully added GitHub link to Project Resource Vault: ${repoInfo.url}`);
    }
  } catch (err) {
    console.error("Failed to automatically add repository resource link to Resource Vault:", err);
  }

  return repoInfo;
}
