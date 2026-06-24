# 🤝 Project Matchmaker

**Live Demo**: [https://project-matchmaker-chi.vercel.app/](https://project-matchmaker-chi.vercel.app/)

Project Matchmaker is a production-ready, full-stack Next.js web application designed to help developers, students, and creators find the perfect teammates for hackathons, college projects, startup ideas, and open-source collaborations.

The platform goes beyond simple listings by providing intelligent AI-driven matchmaking recommendation scores, automated GitHub repository provisioning for active teams, real-time Pusher socket notifications, and private secure workspaces (Hubs) equipped with chat rooms, discussions, Kanban boards, expense logs, and peer trust reviews.

---

## 🚀 Key Features

* **🤖 AI-Powered Matchmaking**: Intelligent recommendation engine utilizing Google Gemini API (with Groq and OpenRouter alternatives) to rank developers based on technical skills, GitHub profiles, past project counts, availability, and peer feedback score. Automatically falls back to a mathematical rule-based match score calculator if API keys are absent.
* **🔐 NextAuth GitHub Integration**: Single Sign-On (SSO) with GitHub, capturing developer details, public repositories count, and programming language distributions while securely persisting OAuth access tokens for repository actions.
* **🛠️ Auto GitHub Setup**: Automatically provisions a new GitHub repository under the owner's account the moment a project status transitions to **Active**. Instantly invites all accepted team members as repository collaborators and links the repository to the workspace resources vault.
* **💬 Smart Notification Hub**: Event-driven real-time notifications powered by Pusher. Tracks project invitations, application updates, real-time team chats, task assignments, expense additions, and approaching deadlines.
* **📦 Private Workspace Hubs**: Fully secure private workspaces for projects with at least two team members, containing:
  * **💬 Real-Time Chat**: Direct channels for project-wide instant messaging.
  * **📋 Kanban Board**: Interactive, drag-and-drop task management powered by `@dnd-kit`.
  * **💸 Expense Tracker**: Shared budget logs with interactive category breakdowns using Recharts.
  * **🔗 Resources Vault**: Storage of shared links and repository integrations.
  * **💡 Discussions Forum**: Threaded QA topics and project design discussions.
  * **📊 Workspace Analytics**: Real-time project velocity metrics, budget spent, and tasks completed.
* **⭐ Peer Endorsements**: Post-project 360-degree reviews (scoring Technical Skills, Communication, Teamwork, and Reliability) that aggregate into a developer's public **Trust Score**.
* **🎨 Premium Dialogs**: Modern, customized style Alert Dialog components replacing raw browser confirm popups for high-stakes actions like project deletion, leaving teams, and kicking members.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16+ (App Router)
* **Language**: TypeScript
* **Database**: MongoDB (Mongoose ORM)
* **Authentication**: Auth.js / NextAuth v5 (GitHub OAuth)
* **Styling**: Tailwind CSS v4 & PostCSS
* **Real-time Engine**: Pusher Sockets
* **AI Engine**: Google Gemini API (`gemini-2.0-flash-lite`), Groq, and OpenRouter
* **Asset Uploads**: Cloudinary
* **UI Components**: Lucide React Icons, `@dnd-kit` (Kanban), and Recharts (Data Visualizations)

---

## 🏗️ Folder Structure

```text
src/
├── app/
│   ├── page.tsx                     # Landing Page (Hero, search, features)
│   ├── layout.tsx                   # Main Layout (Navbar wrapper)
│   ├── globals.css                  # Custom theme variables & Tailwind @import
│   ├── auth/login/page.tsx          # GitHub OAuth sign-in page
│   ├── dashboard/
│   │   ├── page.tsx                 # User projects, applications, invitations, AI recommendations
│   │   └── invitations/
│   │       └── page.tsx             # Legacy invitations redirect route
│   ├── projects/
│   │   ├── page.tsx                 # Project discovery search page
│   │   ├── create/page.tsx          # Project creation form
│   │   └── [id]/page.tsx            # Project details, application form, owner tools
│   ├── profile/[username]/page.tsx  # Developer profiles (skills, public repos, trust score, reviews)
│   ├── hub/[projectId]/
│   │   ├── page.tsx                 # Team Workspace Hub layout
│   │   ├── WorkspaceHubClient.tsx   # Client hub module manager (chat, kanban, discussions, etc.)
│   │   ├── tasks/
│   │   │   └── page.tsx             # Legacy tasks redirect route
│   │   └── expenses/
│   │       └── page.tsx             # Legacy expenses redirect route
│   └── api/
│       ├── auth/[...nextauth]/      # NextAuth OAuth router
│       ├── upload/                  # Cloudinary image upload route
│       ├── cron/deadlines/          # Vercel Cron deadline check scheduler
│       ├── notifications/
│          ├── route.tsx            # Fetch notifications API endpoint
│          ├── read-all/            # Bulk mark-as-read API endpoint
│          └── [id]/read/           # Mark single notification as read API endpoint
│    
├── components/
│   ├── Navbar.tsx                   # Top navigation layout
│   ├── Sidebar.tsx                  # Hub side-navigation selector
│   ├── ProjectCard.tsx              # Project preview grid item
│   ├── UserCard.tsx                 # Matching profile card
│   ├── ChatBox.tsx                  # Conversation component
│   ├── KanbanBoard.tsx              # Built-in tasks tracker
│   ├── ExpenseChart.tsx             # Budget tracker utilizing Recharts
│   ├── RecommendationCard.tsx       # AI teammate candidate invite form
│   ├── SkillBadge.tsx               # Skills pill badge
│   ├── StatusBadge.tsx              # Availability/status badge
│   ├── ReviewCard.tsx               # Teammate endorsement feedback
│   ├── AlertDialog.tsx              # Shadcn-style custom confirm modal
│   └── notifications/
│       ├── NotificationBell.tsx     # Sockets notification indicator
│       └── NotificationDropdown.tsx # Notifications history dropdown
├── lib/
│   ├── db.ts                        # Mongoose database connector & startup cron
│   ├── aiconfig.ts                  # Multi-model AI recommendation scoring engine
│   ├── cloudinary.ts                # Cloudinary image upload handler
│   ├── github.ts                    # GitHub REST API integrations client
│   ├── githubSetup.ts               # Repository auto-setup orchestrator
│   ├── notificationEvents.ts        # Sockets notification dispatcher
│   ├── notificationService.ts       # Database notification creator & scheduler
│   ├── pusherClient.ts              # Client-side Pusher connector
│   ├── pusherServer.ts              # Server-side Pusher connector
│   ├── models/
│   │   ├── index.ts                 # Main models exporter
│   │   ├── User.ts                  # User schema with github token field
│   │   ├── Project.ts               # Project schema with status parameters
│   │   ├── TeamMember.ts            # Member permissions schema
│   │   ├── Task.ts                  # Task schema with deadline parameters
│   │   ├── Expense.ts               # Budget logs schema
│   │   ├── Resource.ts              # Workspace resource links schema
│   │   ├── Notification.ts          # Notifications persistence schema
│   │   ├── Discussion.ts            # Forum topics schema
│   │   ├── DiscussionReply.ts       # Forum replies schema
│   │   ├── Message.ts               # Chat log schema
│   │   ├── Invitation.ts            # Team invitations schema
│   │   ├── Application.ts           # Applications schema
│   │   └── Hub.ts                   # Hub provisioning schema
│   └── actions/
│       ├── chatActions.ts           # Chat messaging server actions
│       ├── hubActions.ts            # Tasks, expenses, resources, discussions server actions
│       ├── memberActions.ts         # Applications and invitations server actions
│       ├── profileActions.ts        # Reviews submission server actions
│       └── projectActions.ts        # Project updates & auto github repository setup actions
```

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the root directory. You can copy the template from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Fill in the appropriate configuration keys:

```ini
# MongoDB connection string
MONGODB_URI=mongodb://your_mongodb_connection_uri

# NextAuth secret configuration (generate with: npx auth secret)
AUTH_SECRET=your_nextauth_secret

# GitHub OAuth credentials (with user:email, read:user, public_repo scopes)
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret

# Cloudinary parameters (for asset uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# AI Recommendation model configuration
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Pusher credentials (for real-time notifications and messaging)
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

---

## 💻 Running the App Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---


---

## 🤖 AI Matchmaking Logic

Project Matchmaker calculates candidate matching scores (0-100) using a weighted evaluation process:
* **40% Skills Match**: Matching required skills against developer profile skill tags.
* **20% GitHub Activity**: Evaluation of public repositories count and code languages.
* **20% Project Experience**: Completed projects count.
* **10% Peer Reviews**: Overall rating score derived from Communication, Reliability, and Teamwork.
* **10% Availability**: Current status indicator.

If `GEMINI_API_KEY` is not set, the application automatically tries for the `GROQ_API_KEY` and `OPENROUTER_API_KEY` and if all are not set, it triggers a **mathematical rule-based fallback matchmaking calculator**, preventing API crashes and displaying recommendations in offline/local environments.

---

## 🔐 Security & Access Rules

* **Visitors (Anonymous)**: Can view landing pages, public developer profiles, and public projects listings. Cannot create projects, apply to projects, or access workspace hubs.
* **Logged-in Users**: Can create projects, edit/sync profiles, apply to projects, and respond to incoming team invitations.
* **Project Owners**: Can modify project parameters, update status (Recruiting, Active, Completed, Archived), manage team applicants (Accept/Reject), kick team members, and access the private hub.
* **Team Members**: Can access the private Workspace Hub (chat, tasks, discussions, vault, budget logs) and post peer reviews once the project status transitions to **Completed**.
