"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { Project, TeamMember, Application, Invitation, Hub, User } from "@/lib/models";
import mongoose from "mongoose";
import { createNotification } from "@/lib/notificationService";

// Create automatic hub workspace if >= 2 members
async function ensureHubExists(projectId: string) {
  const memberCount = await TeamMember.countDocuments({ project: projectId });
  if (memberCount >= 2) {
    const existingHub = await Hub.findOne({ project: projectId });
    if (!existingHub) {
      await Hub.create({ project: projectId });
    }
  }
}

// 1. Apply to Project
export async function applyToProject(projectId: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to apply.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found.");
  
  if (project.owner.toString() === session.user.id) {
    throw new Error("You cannot apply to your own project.");
  }

  const existingMember = await TeamMember.findOne({ project: projectId, user: session.user.id });
  if (existingMember) {
    throw new Error("You are already a member of this project.");
  }

  const existingApp = await Application.findOne({ project: projectId, user: session.user.id });
  if (existingApp) {
    throw new Error("You have already applied to this project.");
  }

  const app = await Application.create({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(session.user.id),
    message,
    status: "Pending",
  });

  // Trigger APPLICATION_UPDATE notification to the project owner
  try {
    await createNotification({
      recipient: project.owner.toString(),
      sender: session.user.id,
      type: "APPLICATION_UPDATE",
      title: "New Project Application",
      message: `${session.user.name || "A developer"} applied to join your project "${project.title}"`,
      link: `/projects/${projectId}`,
      priority: "MEDIUM",
      metadata: {
        projectId,
        applicationId: app._id.toString(),
      },
    });
  } catch (err) {
    console.error("Failed to create application notification:", err);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return { success: true, applicationId: app._id.toString() };
}

// 2. Respond to Application (Accept / Reject)
export async function respondToApplication(applicationId: string, status: "Accepted" | "Rejected") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  await connectToDatabase();

  const application = await Application.findById(applicationId).populate("project");
  if (!application) throw new Error("Application not found.");

  const project = application.project as any;
  if (!project) throw new Error("Associated project not found.");

  if (project.owner.toString() !== session.user.id) {
    throw new Error("You are not authorized to manage applications for this project.");
  }

  application.status = status;
  await application.save();

  if (status === "Accepted") {
    // Add User as Team Member
    const applicant = await User.findById(application.user);
    const applicantRole = applicant?.roles?.[0] || "Contributor";

    // Verify team limits
    const currentMemberCount = await TeamMember.countDocuments({ project: project._id });
    if (currentMemberCount >= project.maxTeamSize) {
      throw new Error("The project team has reached its maximum size.");
    }

    try {
      await TeamMember.create({
        project: project._id,
        user: application.user,
        role: applicantRole,
      });
    } catch (e) {
      // If already a member, ignore
    }

    // Auto provision Workspace Hub if project size >= 2
    await ensureHubExists(project._id.toString());

    // Trigger APPLICATION_ACCEPTED notification
    try {
      await createNotification({
        recipient: application.user.toString(),
        sender: session.user.id,
        type: "APPLICATION_ACCEPTED",
        title: "Application Accepted",
        message: `Your application for "${project.title}" was accepted`,
        link: `/projects/${project._id}`,
        priority: "HIGH",
        metadata: {
          projectId: project._id.toString(),
        },
      });
    } catch (err) {
      console.error("Failed to create application accepted notification:", err);
    }
  } else if (status === "Rejected") {
    // Trigger APPLICATION_REJECTED notification
    try {
      await createNotification({
        recipient: application.user.toString(),
        sender: session.user.id,
        type: "APPLICATION_REJECTED",
        title: "Application Rejected",
        message: `Your application for "${project.title}" was rejected`,
        link: `/projects/${project._id}`,
        priority: "MEDIUM",
        metadata: {
          projectId: project._id.toString(),
        },
      });
    } catch (err) {
      console.error("Failed to create application rejected notification:", err);
    }
  }

  revalidatePath(`/projects/${project._id}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// 3. Send Invitation (Owner -> Candidate)
export async function sendInvitation(projectId: string, receiverId: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found.");

  if (project.owner.toString() !== session.user.id) {
    throw new Error("Only the project owner can send invitations.");
  }

  const existingMember = await TeamMember.findOne({ project: projectId, user: receiverId });
  if (existingMember) {
    throw new Error("The user is already a member of this project.");
  }

  const existingInvite = await Invitation.findOne({ project: projectId, receiver: receiverId });
  if (existingInvite) {
    if (existingInvite.status === "Pending") {
      throw new Error("An invitation has already been sent to this user.");
    }
    
    // Update and reset existing invitation to pending with the new message
    existingInvite.status = "Pending";
    existingInvite.message = message;
    existingInvite.sender = new mongoose.Types.ObjectId(session.user.id);
    await existingInvite.save();

    // Trigger PROJECT_INVITATION notification
    try {
      await createNotification({
        recipient: receiverId,
        sender: session.user.id,
        type: "PROJECT_INVITATION",
        title: "New Team Invitation",
        message: `You have been invited to join "${project.title}"`,
        link: "/dashboard",
        priority: "HIGH",
        metadata: {
          projectId,
          invitationId: existingInvite._id.toString(),
        },
      });
    } catch (err) {
      console.error("Failed to create invitation notification:", err);
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, invitationId: existingInvite._id.toString() };
  }

  const invite = await Invitation.create({
    project: new mongoose.Types.ObjectId(projectId),
    sender: new mongoose.Types.ObjectId(session.user.id),
    receiver: new mongoose.Types.ObjectId(receiverId),
    message,
    status: "Pending",
  });

  // Trigger PROJECT_INVITATION notification
  try {
    await createNotification({
      recipient: receiverId,
      sender: session.user.id,
      type: "PROJECT_INVITATION",
      title: "New Team Invitation",
      message: `You have been invited to join "${project.title}"`,
      link: "/dashboard",
      priority: "HIGH",
      metadata: {
        projectId,
        invitationId: invite._id.toString(),
      },
    });
  } catch (err) {
    console.error("Failed to create invitation notification:", err);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return { success: true, invitationId: invite._id.toString() };
}

// 4. Respond to Invitation (Accept / Decline)
export async function respondToInvitation(invitationId: string, status: "Accepted" | "Declined") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  await connectToDatabase();

  const invitation = await Invitation.findById(invitationId).populate("project");
  if (!invitation) throw new Error("Invitation not found.");

  if (invitation.receiver.toString() !== session.user.id) {
    throw new Error("You are not the recipient of this invitation.");
  }

  invitation.status = status;
  await invitation.save();

  if (status === "Accepted") {
    const project = invitation.project as any;
    if (!project) throw new Error("Project not found.");

    // Check maximum team limit
    const currentMemberCount = await TeamMember.countDocuments({ project: project._id });
    if (currentMemberCount >= project.maxTeamSize) {
      throw new Error("The project team has reached its maximum size.");
    }

    const receiver = await User.findById(invitation.receiver);
    const receiverRole = receiver?.roles?.[0] || "Contributor";

    try {
      await TeamMember.create({
        project: project._id,
        user: invitation.receiver,
        role: receiverRole,
      });
    } catch (e) {
      // Ignore if already a member
    }

    // Auto provision Workspace Hub if project size >= 2
    await ensureHubExists(project._id.toString());
  }

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${invitation.project._id}`);

  return { success: true };
}

// 5. Remove Team Member / Leave Project
export async function removeTeamMember(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found.");

  const isOwner = project.owner.toString() === session.user.id;
  const isSelf = userId === session.user.id;

  if (!isOwner && !isSelf) {
    throw new Error("You are not authorized to remove members from this team.");
  }

  if (isOwner && isSelf) {
    throw new Error("The project owner cannot leave the team. Delete or transfer ownership of the project instead.");
  }

  await TeamMember.deleteOne({ project: projectId, user: userId });

  // Clean up any pending applications or invitations
  await Application.deleteOne({ project: projectId, user: userId });
  await Invitation.deleteOne({ project: projectId, receiver: userId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/hub/${projectId}`);

  return { success: true };
}
