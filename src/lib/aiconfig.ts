import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "./db";
import { User, Project } from "./models";

export interface IRecommendation {
  userId: string;
  matchScore: number;
  reasons: string[];
}

export async function getRecommendations(projectId: string): Promise<IRecommendation[]> {
  await connectToDatabase();

  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Get all candidate users (exclude the owner)
  const candidates = await User.find({
    _id: { $ne: project.owner },
    availability: { $in: ["Available", "Looking for Team", "Looking for Projects"] }
  }).limit(10);

  if (candidates.length === 0) {
    return [];
  }

  const projectData = {
    title: project.title,
    description: project.description,
    category: project.category,
    requiredSkills: project.requiredSkills,
    requiredRoles: project.requiredRoles,
  };

  const candidatesData = candidates.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
    username: c.username,
    skills: c.skills,
    roles: c.roles,
    availability: c.availability,
    trustScore: c.trustScore,
    completedProjects: c.completedProjects,
    contributionCount: c.contributionCount,
    publicRepos: c.publicRepos.map((r: any) => ({ name: r.name, language: r.language })),
  }));

  const prompt = `
  You are an expert AI matchmaker. Your task is to rank the candidate users for a project based on their compatibility.
  
  Here is the project information:
  ${JSON.stringify(projectData, null, 2)}

  Here are the candidates:
  ${JSON.stringify(candidatesData, null, 2)}

  Please calculate a compatibility score (0 to 100) for each candidate using the following weighting scheme:
  - 40% Skills Match: Compare candidate's skills with requiredSkills.
  - 20% GitHub Activity: Evaluate publicRepos and contributionCount.
  - 20% Previous Project Experience: Evaluate completedProjects.
  - 10% Reviews & Trust Score: Evaluate trustScore.
  - 10% Availability Status: ("Available", "Looking for Team", "Looking for Projects" gets 100% of this portion, "Busy" gets 0%).

  Return a JSON object containing a "recommendations" key. The value of "recommendations" must be a JSON array of objects, where each object has:
  - userId: string
  - matchScore: number (integer between 0 and 100)
  - reasons: string[] (Provide exactly 3 concise, user-friendly reasons explaining the score, e.g. "React expert", "200 GitHub contributions", "Completed 5 projects").
  `;

  // 1. Try Groq (Llama 3.3 70B - completely free & extremely fast)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    console.log("Using Groq for match recommendations...");
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        const responseText = resData.choices[0].message.content;
        const parsed = parseRecommendationJson(responseText);
        if (parsed && parsed.length > 0) return parsed;
      } else {
        console.warn("Groq API responded with status:", response.status);
      }
    } catch (err) {
      console.error("Groq recommendation failed, trying fallbacks...", err);
    }
  }

  // 2. Try OpenRouter (Routes meta-llama/llama-3-8b-instruct:free or similar free models)
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    console.log("Using OpenRouter for match recommendations...");
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/lakshay-sudhera/Project-Matchmaker-1",
          "X-Title": "Project Matchmaker",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        const responseText = resData.choices[0].message.content;
        const parsed = parseRecommendationJson(responseText);
        if (parsed && parsed.length > 0) return parsed;
      } else {
        console.warn("OpenRouter API responded with status:", response.status);
      }
    } catch (err) {
      console.error("OpenRouter recommendation failed, trying fallbacks...", err);
    }
  }

  // 3. Try Google Gemini (original fallback/primary)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log("Using Google Gemini for match recommendations...");
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = parseRecommendationJson(responseText);
      if (parsed && parsed.length > 0) return parsed;
    } catch (err) {
      console.error("Gemini recommendation failed, falling back...", err);
    }
  }

  // 4. Default programmatic fallback (guaranteed to work offline/free)
  console.log("Running programmatic rule-based matchmaking fallback.");
  return calculateRuleBasedMatches(project, candidates);
}

// Clean helper to parse JSON array from raw or wrapped responses
function parseRecommendationJson(text: string): IRecommendation[] | null {
  try {
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const data = JSON.parse(jsonText);
    const matches = Array.isArray(data) ? data : (data.recommendations || data.matches || []);

    if (Array.isArray(matches)) {
      return matches.map((m: any) => ({
        userId: String(m.userId),
        matchScore: Number(m.matchScore),
        reasons: Array.isArray(m.reasons) ? m.reasons.map(String) : [],
      })).sort((a, b) => b.matchScore - a.matchScore);
    }
  } catch (err) {
    console.error("Failed to parse Recommendation JSON structure:", err);
  }
  return null;
}

// Programmatic fallback
function calculateRuleBasedMatches(project: any, candidates: any[]): IRecommendation[] {
  const matches = candidates.map((c) => {
    let skillsScore = 0;
    const projectSkills = project.requiredSkills.map((s: string) => s.toLowerCase());
    const userSkills = c.skills.map((s: string) => s.toLowerCase());
    const commonSkills = projectSkills.filter((s: string) => userSkills.includes(s));

    if (projectSkills.length > 0) {
      skillsScore = (commonSkills.length / projectSkills.length) * 40;
    } else {
      skillsScore = 40;
    }

    const githubScore = Math.min((c.contributionCount / 100) * 20, 20);
    const projectExpScore = Math.min((c.completedProjects / 5) * 20, 20);
    const trustExpScore = (c.trustScore / 100) * 10;
    const availabilityScore = c.availability === "Busy" ? 0 : 10;

    const matchScore = Math.round(skillsScore + githubScore + projectExpScore + trustExpScore + availabilityScore);

    const reasons = [
      commonSkills.length > 0 ? `${commonSkills.slice(0, 2).join(", ")} matching skills` : "Has foundational skills",
      c.contributionCount > 0 ? `${c.contributionCount} GitHub contributions` : "Active code repository",
      c.completedProjects > 0 ? `Completed ${c.completedProjects} previous projects` : "Ready for first collaboration"
    ];

    return {
      userId: c._id.toString(),
      matchScore,
      reasons,
    };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
