import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          await connectToDatabase();
          const email = user.email || `${(profile as any)?.login}@github.com`;
          const existingUser = await User.findOne({ email });
          
          if (!existingUser) {
            let repos: any[] = [];
            const languages = new Set<string>();
            const username = (profile as any)?.login || user.name || "user";
            
            try {
              // Fetch public repos (limit to 10 for performance)
              const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=10`);
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                  repos = data.map((r: any) => {
                    if (r.language) languages.add(r.language);
                    return {
                      name: r.name,
                      description: r.description || "",
                      htmlUrl: r.html_url,
                      stars: r.stargazers_count || 0,
                      language: r.language || "",
                    };
                  });
                }
              }
            } catch (e) {
              console.error("Failed to fetch GitHub repositories:", e);
            }

            const bioText = (profile as any)?.bio || "Passionate software developer.";
            const githubProfileUrl = (profile as any)?.html_url || `https://github.com/${username}`;
            const devLanguages = Array.from(languages);
            const skills = devLanguages.length > 0 ? devLanguages : ["Javascript", "TypeScript", "Git"];
            if (!skills.includes("Git")) skills.push("Git");
            if (!skills.includes("GitHub")) skills.push("GitHub");

            await User.create({
              name: user.name || username,
              email: email,
              image: user.image || (profile as any)?.avatar_url,
              username: username,
              bio: bioText,
              githubUrl: githubProfileUrl,
              publicRepos: repos,
              languages: devLanguages,
              contributionCount: (profile as any)?.public_repos || repos.length || 0,
              skills: skills,
              roles: ["Fullstack"],
              availability: "Available",
              trustScore: 100,
              completedProjects: 0,
              ratingCount: 0,
            });
          } else {
            // Sync user details that might have changed
            existingUser.image = user.image || existingUser.image;
            if ((profile as any)?.bio) {
              existingUser.bio = (profile as any).bio;
            }
            await existingUser.save();
          }
        } catch (err) {
          console.error("Error creating/updating user during login:", err);
        }
      }
      return true;
    },
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.username = (profile as any)?.login || user.name || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          (session.user as any).username = dbUser.username;
          (session.user as any).skills = dbUser.skills;
          (session.user as any).roles = dbUser.roles;
          (session.user as any).availability = dbUser.availability;
          (session.user as any).trustScore = dbUser.trustScore;
        }
      }
      return session;
    },
  },
});
