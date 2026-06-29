import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Issue, Comment, UserProfile, PredictiveInsight, AIAnalysis, Badge } from "./src/types";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./server/middleware/auth";
import { User } from "./server/models/User";
import { Issue as MongooseIssue } from "./server/models/Issue";
import { Conversation } from "./server/models/Conversation";

dotenv.config();

// Mongoose database connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Mongoose connected to MongoDB successfully."))
    .catch((err) => {
      console.warn("MongoDB connection failed:", err.message);
    });
} else {
  console.log("Mongoose: MongoDB connection omitted (running local mock/in-memory database fallback).");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Gemini API Client
let geminiClient: GoogleGenAI | null = null;
let geminiCooldownUntil = 0;

function getGeminiClient(): GoogleGenAI | null {
  if (Date.now() < geminiCooldownUntil) {
    return null;
  }
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.warn("Failed to initialize Gemini Client:", e);
      }
    }
  }
  return geminiClient;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.statusCode || error.code;
      const message = error.message || "";
      
      const isQuotaLimit = 
        status === 429 && (
          message.toLowerCase().includes("quota") ||
          message.toLowerCase().includes("exceeded") ||
          message.toLowerCase().includes("rate limit") ||
          message.toLowerCase().includes("limit exceeded") ||
          message.toLowerCase().includes("resource_exhausted")
        );

      if (isQuotaLimit) {
        console.warn(`Gemini API Quota/Rate Limit exceeded (429). Activating a 60-second cooldown where the server will automatically use local programmatic ranking and mocking.`);
        geminiCooldownUntil = Date.now() + 60 * 1000;
        throw error;
      }

      const isTransient =
        status === 503 ||
        status === 500 ||
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand");

      if (isTransient && i < retries - 1) {
        const jitter = Math.random() * 500;
        const sleepMs = delay * Math.pow(2, i) + jitter;
        console.warn(`Gemini API transient error (status: ${status || 'unknown'}, message: ${message}). Retrying in ${Math.round(sleepMs)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(sleepMs);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

// Global In-Memory Database (with static seed data)
const seedIssues: Issue[] = [
  {
    id: "issue-1",
    title: "Deep Pothole at School Crossing",
    description: "There is a massive pothole right before the pedestrian crossing near Oakwood Elementary. Cars are swerving lanes to avoid it, creating a severe hazard during school pick-up hours.",
    category: "Road Safety & Potholes",
    status: "in_progress",
    urgency: "high",
    latitude: 37.7785,
    longitude: -122.4152,
    address: "412 Oakwood Dr (Near School)",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    reporterId: "user-2",
    reporterName: "Elena Rostova",
    upvotesCount: 24,
    upvotedBy: ["user-2", "user-3", "user-4", "user-test"],
    downvotesCount: 0,
    downvotedBy: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "comm-1",
        userId: "user-3",
        userName: "Marc Henderson",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        content: "Nearly popped my front tire here yesterday! Extremely dangerous, especially in the rain when filled with water.",
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficialResponse: false
      },
      {
        id: "comm-2",
        userId: "user-city-rep",
        userName: "District Public Works",
        userAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&q=80",
        content: "Thank you for the report. A repair team has been assigned and cold-patch fixing is scheduled for tomorrow morning.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficialResponse: true
      }
    ],
    aiAnalysis: {
      category: "Road Safety & Potholes",
      urgency: "high",
      categoryExplanation: "Located immediately in front of a school crosswalk, affecting both pedestrian child safety and active vehicle maneuvering.",
      suggestedResolutionSteps: [
        "Deploy temporary high-visibility cones to alert approaching motorists.",
        "Assess damage to asphalt substrate and apply hot-mix structural patch.",
        "Inspect surrounding asphalt for secondary micro-fissures and seal."
      ],
      priorityRationale: "Heavy traffic zone coupled with high pedestrian density of children warrants immediate elevated response.",
      riskScore: 82
    },
    interestCount: 3,
    supporters: [
      { userId: "user-2", userName: "Elena Rostova", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { userId: "user-3", userName: "Marc Henderson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: "issue-2",
    title: "Burst Water Main Flooding Sidewalk",
    description: "Water has been continuously bubbling up from the sidewalk joint, creating a huge stream that flows into the storm drain. It looks like a clean water supply leakage rather than sewage, but it is wasting hundreds of gallons.",
    category: "Water & Utilities",
    status: "verified",
    urgency: "medium",
    latitude: 37.7842,
    longitude: -122.4081,
    address: "883 Cedar Blvd (Opposite Park)",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    reporterId: "user-4",
    reporterName: "Jameson Lee",
    upvotesCount: 14,
    upvotedBy: ["user-4", "user-3", "user-test"],
    downvotesCount: 1,
    downvotedBy: ["user-2"],
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "comm-3",
        userId: "user-2",
        userName: "Elena Rostova",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        content: "Verified, walked past it today. Sidewalk is extremely slick with moss starting to form.",
        createdAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficialResponse: false
      }
    ],
    aiAnalysis: {
      category: "Water & Utilities",
      urgency: "medium",
      categoryExplanation: "Utility failure causing continuous, non-hazardous freshwater loss and sidewalk erosion.",
      suggestedResolutionSteps: [
        "Dispatch municipal water technician to isolate and close local loop control valve.",
        "Excavate localized sidewalk section and replace fractured connection collar.",
        "Backfill and restore sidewalk integrity."
      ],
      priorityRationale: "Significant resource waste combined with minor structural erosion risk, but doesn't present immediate life safety threat.",
      riskScore: 48
    }
  },
  {
    id: "issue-3",
    title: "Broken Streetlight Creating Blackout Alley",
    description: "The street light in the alleyway between Elm and Pine has been completely dead for over a week. The pathway is pitch black at night, and many shift workers use it to get to the subway station. Felt very unsafe walking home.",
    category: "Public Lights & Electrical",
    status: "reported",
    urgency: "medium",
    latitude: 37.7712,
    longitude: -122.4231,
    address: "Elm St Alleyway (Behind Transit Hub)",
    imageUrl: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=600&q=80",
    reporterId: "user-3",
    reporterName: "Marc Henderson",
    upvotesCount: 9,
    upvotedBy: ["user-3", "user-4"],
    downvotesCount: 0,
    downvotedBy: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    comments: [],
    aiAnalysis: {
      category: "Public Lights & Electrical",
      urgency: "medium",
      categoryExplanation: "Electrical malfunction causing darkness in a highly-trafficked commuter pedestrian walkway.",
      suggestedResolutionSteps: [
        "Verify circuit breaker health in the sector feeder cabinet.",
        "Replace damaged bulb/LED driver assembly in the alleyway light fixture.",
        "Inspect wiring insulation for signs of pest damage or water intrusion."
      ],
      priorityRationale: "Impedes commuter safety and increases vulnerability to local crime due to complete visual blackout.",
      riskScore: 58
    }
  },
  {
    id: "issue-4",
    title: "Illegal Trash Dumping in Greenway Park",
    description: "Someone dumped several old mattresses, building materials, and broken electronics right next to the nature trail in the park. It's an eyesore and some of the electronics have leaky batteries which might contaminate the soil.",
    category: "Waste & Sanitation",
    status: "resolved",
    urgency: "medium",
    latitude: 37.7891,
    longitude: -122.4114,
    address: "Greenway Nature Trail (East Entrance)",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    reporterId: "user-5",
    reporterName: "Sarah Connor",
    upvotesCount: 32,
    upvotedBy: ["user-5", "user-2", "user-3", "user-4", "user-test"],
    downvotesCount: 0,
    downvotedBy: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "comm-4",
        userId: "user-test",
        userName: "You (Citizen Hero)",
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        content: "Unbelievable. The nature reserve should have security cameras at the gates to prevent this.",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficialResponse: false
      },
      {
        id: "comm-5",
        userId: "user-city-rep",
        userName: "City Parks Department",
        userAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&q=80",
        content: "Update: Environmental cleanup crew has completely cleared the dump. Electronics have been recycled safely. Case closed!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isOfficialResponse: true
      }
    ],
    aiAnalysis: {
      category: "Waste & Sanitation",
      urgency: "medium",
      categoryExplanation: "Illegal solid waste and toxic e-waste accumulation in an environmentally sensitive public recreation zone.",
      suggestedResolutionSteps: [
        "Deploy a containment team to carefully extract toxic electronic waste.",
        "Haul bulk bedding and construction debris to authorized municipal treatment centers.",
        "Enforce surveillance or signage near the trail access point."
      ],
      priorityRationale: "Visual degradation and local ecological toxicity risk make it a moderate urgency public parks task.",
      riskScore: 61
    }
  },
  {
    id: "issue-stale",
    title: "Abandoned Rusty Construction Frame",
    description: "A rusty metal reinforcement frame has been left on the grass margin near the park pathway. It has sharp edges pointing up and is starting to gather weeds. Reported over two months ago with zero subsequent verification activity.",
    category: "Road Safety & Potholes",
    status: "reported",
    urgency: "low",
    latitude: 37.7815,
    longitude: -122.4210,
    address: "Pine St Grass Margin (Near Park)",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    reporterId: "user-3",
    reporterName: "Marc Henderson",
    upvotesCount: 1,
    upvotedBy: ["user-3"],
    downvotesCount: 0,
    downvotedBy: [],
    createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    aiAnalysis: null
  }
];

let issues: Issue[] = [...seedIssues];

// Citizen Hero users and points (for gamification)
let userProfiles: Record<string, UserProfile> = {
  "user-test": {
    id: "user-test",
    name: "Alex Carter",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    role: "citizen",
    points: 120,
    reportsCount: 1,
    verificationsCount: 3,
    badges: [
      {
        id: "badge-1",
        name: "First Reporter",
        description: "Successfully flagged your first community issue",
        icon: "Flag",
        color: "text-blue-500 bg-blue-50",
        unlockedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "badge-2",
        name: "Eagle Eye",
        description: "Verified 3 community issues accurately",
        icon: "Eye",
        color: "text-emerald-500 bg-emerald-50",
        unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  "architect-test": {
    id: "architect-test",
    name: "Diana Sterling",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    role: "architect",
    specialty: "🧱 Structural Repairs",
    points: 150,
    reportsCount: 0,
    verificationsCount: 12,
    badges: [
      {
        id: "elite-architect",
        name: "Elite Architect",
        description: "Certified community problem solver",
        icon: "Crown",
        color: "text-amber-500 bg-amber-50",
        unlockedAt: new Date().toISOString()
      },
      {
        id: "master-solver",
        name: "Master Solver",
        description: "Joined the prestigious solver elite",
        icon: "Shield",
        color: "text-purple-500 bg-purple-50",
        unlockedAt: new Date().toISOString()
      }
    ]
  },

  "user-2": {
    id: "user-2",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    points: 240,
    reportsCount: 4,
    verificationsCount: 8,
    badges: [
      {
        id: "badge-1",
        name: "First Reporter",
        description: "Successfully flagged your first community issue",
        icon: "Flag",
        color: "text-blue-500 bg-blue-50",
        unlockedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "badge-3",
        name: "Community Pillar",
        description: "Contributed over 200 points to local coordination",
        icon: "Award",
        color: "text-amber-500 bg-amber-50",
        unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  "user-3": {
    id: "user-3",
    name: "Marc Henderson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    points: 180,
    reportsCount: 3,
    verificationsCount: 5,
    badges: [
      {
        id: "badge-1",
        name: "First Reporter",
        description: "Successfully flagged your first community issue",
        icon: "Flag",
        color: "text-blue-500 bg-blue-50",
        unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
};

// GET all issues
app.get("/api/issues", (req, res) => {
  // Sweep reported issues older than 60 days to auto-archive
  const now = new Date();
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  issues.forEach(i => {
    if (i.status === "reported") {
      const createdDate = new Date(i.createdAt);
      if (now.getTime() - createdDate.getTime() > sixtyDaysInMs) {
        i.status = "resolved"; // Resolve or archive
        // Add official system archiver feedback if not present
        if (!i.comments.some(c => c.id === "system-archive")) {
          i.comments.push({
            id: "system-archive",
            userId: "system-archiver",
            userName: "System Archiver",
            userAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&q=80",
            content: "⚠️ System Closeout: This community hazard ticket was closed because it spent over 60 days in 'Reported' status with no civic activity. This keeps the Oakridge meadows dispatch map actionable.",
            createdAt: now.toISOString(),
            isOfficialResponse: true
          });
        }
      }
    }
  });

  res.json(issues);
});

// Dynamic Badge Calculator based on user reports & votes categories
function getDynamicBadgesForUser(userId: string, currentBadges: Badge[]): Badge[] {
  const updatedBadges = [...(currentBadges || [])];

  // Filter user's reports & verifications (upvotes)
  const userReports = issues.filter(i => i.reporterId === userId);
  const userUpvotes = issues.filter(i => i.upvotedBy.includes(userId));

  // Count actions by category
  const categoryCounts: Record<string, number> = {};
  
  userReports.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });
  userUpvotes.forEach(u => {
    categoryCounts[u.category] = (categoryCounts[u.category] || 0) + 1;
  });

  // Category visual honor definitions
  const categoryBadgesConfig = [
    {
      category: "Road Safety & Potholes",
      id: "badge-pothole",
      name: "Pothole Patrol",
      description: "Contributed reports or peer-verifications for 2+ road hazard safety conditions.",
      icon: "ShieldAlert",
      color: "text-red-500 bg-red-950/40 border border-red-500/30"
    },
    {
      category: "Public Lights & Electrical",
      id: "badge-lights",
      name: "Streetlight Sentinel",
      description: "Helped illuminate the dark corners of Oakridge via electrical issue tracking.",
      icon: "Sparkles",
      color: "text-yellow-500 bg-yellow-950/40 border border-yellow-500/30"
    },
    {
      category: "Water & Utilities",
      id: "badge-water",
      name: "Hydro Guardian",
      description: "Eradicated clean resource leakages and local sidewalk water damage hazards.",
      icon: "Droplets",
      color: "text-blue-500 bg-blue-950/40 border border-blue-500/30"
    },
    {
      category: "Waste & Sanitation",
      id: "badge-waste",
      name: "Sanitation Squire",
      description: "Active cleanup dispatcher defending parks and greenways from illegal trash fly-tipping.",
      icon: "Trash2",
      color: "text-orange-500 bg-orange-950/40 border border-orange-500/30"
    }
  ];

  categoryBadgesConfig.forEach(config => {
    const count = categoryCounts[config.category] || 0;
    if (count >= 2) {
      if (!updatedBadges.some(b => b.id === config.id)) {
        updatedBadges.push({
          id: config.id,
          name: config.name,
          description: config.description,
          icon: config.icon,
          color: config.color,
          unlockedAt: new Date().toISOString()
        });
      }
    }
  });

  return updatedBadges;
}

// GET single user profile
app.get("/api/user-profile/:id", (req, res) => {
  const { id } = req.params;
  if (!userProfiles[id]) {
    // Lazy initialize a profile
    userProfiles[id] = {
      id,
      name: "New Citizen",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      points: 10,
      reportsCount: 0,
      verificationsCount: 0,
      badges: []
    };
  }
  
  // Dynamically calculate and append category honors
  const fullProfile = {
    ...userProfiles[id],
    badges: getDynamicBadgesForUser(id, userProfiles[id].badges)
  };
  res.json(fullProfile);
});

// POST to update/set user profile with JWT Token generation and Mongoose Sync
app.post("/api/user-profile", async (req, res) => {
  const profile = req.body as any;
  if (!profile.id) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  const existingProfile = userProfiles[profile.id];
  const isNew = !existingProfile;

  // Determine starting values based on selected role
  let role = profile.role || "citizen";
  let specialty = profile.specialty || "";
  let points = profile.points;
  let badges = profile.badges || [];

  if (isNew) {
    if (role === "architect") {
      points = 100; // Level 2 starts at 100 points
      badges = [
        {
          id: "elite-architect",
          name: "Elite Architect",
          description: "Certified community problem solver",
          icon: "Crown",
          color: "text-amber-500 bg-amber-50",
          unlockedAt: new Date().toISOString()
        },
        {
          id: "master-solver",
          name: "Master Solver",
          description: "Joined the prestigious solver elite",
          icon: "Shield",
          color: "text-purple-500 bg-purple-50",
          unlockedAt: new Date().toISOString()
        },
        {
          id: "specialized-guild",
          name: "Specialized Guild",
          description: `Assigned to a specialized structural unit (${specialty || "Structural Repair"})`,
          icon: "Cpu",
          color: "text-indigo-500 bg-indigo-50",
          unlockedAt: new Date().toISOString()
        }
      ];
    } else {
      points = 25; // Citizen Advocate starts at 25 points
      badges = [
        {
          id: "new-citizen",
          name: "New Citizen",
          description: "Successfully registered as a Citizen Advocate",
          icon: "Smile",
          color: "text-teal-500 bg-teal-50",
          unlockedAt: new Date().toISOString()
        },
        {
          id: "eco-aspirant",
          name: "Eco Aspirant",
          description: "Committed to active neighborhood care",
          icon: "Leaf",
          color: "text-emerald-500 bg-emerald-50",
          unlockedAt: new Date().toISOString()
        }
      ];
    }
  }

  const updatedProfile: UserProfile = {
    id: profile.id,
    name: profile.name || (role === "architect" ? "Elite Architect" : "New Citizen"),
    avatar: profile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    points: points ?? (existingProfile ? existingProfile.points : 10),
    reportsCount: profile.reportsCount || (existingProfile ? existingProfile.reportsCount : 0),
    verificationsCount: profile.verificationsCount || (existingProfile ? existingProfile.verificationsCount : 0),
    role,
    specialty,
    badges: badges.length > 0 ? badges : (existingProfile ? existingProfile.badges : [])
  };

  // Update local memory-store
  userProfiles[profile.id] = updatedProfile;

  // Generate a secure JWT Token
  const token = jwt.sign(
    { 
      id: updatedProfile.id, 
      name: updatedProfile.name, 
      role: updatedProfile.role, 
      specialty: updatedProfile.specialty 
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  // Synchronize with MongoDB User collection via Mongoose Model
  if (mongoose.connection.readyState === 1) {
    try {
      await User.findOneAndUpdate(
        { id: updatedProfile.id },
        {
          name: updatedProfile.name,
          contact: profile.contact,
          avatar: updatedProfile.avatar,
          points: updatedProfile.points,
          reportsCount: updatedProfile.reportsCount,
          verificationsCount: updatedProfile.verificationsCount,
          role: updatedProfile.role,
          specialty: updatedProfile.specialty,
          badges: updatedProfile.badges
        },
        { upsert: true, new: true }
      );
      console.log(`Mongoose: User ${updatedProfile.id} synced with MongoDB.`);
    } catch (err: any) {
      console.warn("Mongoose MongoDB sync warning:", err.message);
    }
  }

  // Return the profile including the JWT token!
  res.json({
    ...updatedProfile,
    token
  });
});

// POST auto-recognize issue details from audio base64 or text
app.post("/api/auto-recognize", async (req, res) => {
  const { audio, mimeType, text } = req.body;
  const ai = getGeminiClient();

  // Initialize defaults
  let result = {
    title: "",
    description: "",
    category: "Other",
    urgency: "medium",
    confidence: 85,
    transcription: ""
  };

  if (!ai) {
    // Dynamic mock fallback based on input if Gemini client isn't fully configured
    const isWater = text?.toLowerCase().includes("water") || text?.toLowerCase().includes("leak");
    const isRoad = text?.toLowerCase().includes("pot") || text?.toLowerCase().includes("road") || text?.toLowerCase().includes("hole");
    const isTrash = text?.toLowerCase().includes("trash") || text?.toLowerCase().includes("dump") || text?.toLowerCase().includes("garbage");
    
    return res.json({
      title: isWater ? "Water Main Leakage" : isRoad ? "Deep Pothole Hazard" : isTrash ? "Illegal Waste Dump" : "Public Safety Hazard",
      description: text || "Recorded citizen voice memo requesting dispatch cleanup. Water and road conditions are affected.",
      category: isWater ? "Water & Utilities" : isRoad ? "Road Safety & Potholes" : isTrash ? "Waste & Sanitation" : "Other",
      urgency: "high",
      confidence: 80,
      transcription: "Voice memo captured successfully. Telemetry indicates a local grid issue."
    });
  }

  try {
    let contents: any[] = [];
    let promptText = "";

    if (audio) {
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType || "audio/webm"
        }
      });
      promptText = `You are an AI community dispatcher. Listen to the citizen's audio report.
Transcribe it completely, then analyze the problem to extract a short descriptive title (3-5 words), a clean description, category, and urgency level.
Respond with a single JSON object matching this schema:
{
  "transcription": "exact transcription of the voice report",
  "title": "short 3-5 word headline",
  "description": "a professional descriptive summary of what is heard",
  "category": "Road Safety & Potholes" | "Waste & Sanitation" | "Water & Utilities" | "Public Lights & Electrical" | "Other",
  "urgency": "low" | "medium" | "high" | "critical",
  "confidence": number
}`;
    } else if (text) {
      promptText = `You are an AI community dispatcher. Analyze the draft text description provided by a citizen.
Extract a short title (3-5 words), clean up the description, categorize, and prioritize the issue.
Respond with a single JSON object matching this schema:
{
  "transcription": "The original text analyzed",
  "title": "short 3-5 word headline",
  "description": "a professional descriptive summary",
  "category": "Road Safety & Potholes" | "Waste & Sanitation" | "Water & Utilities" | "Public Lights & Electrical" | "Other",
  "urgency": "low" | "medium" | "high" | "critical",
  "confidence": number
}

Input text: "${text}"`;
    } else {
      return res.status(400).json({ error: "Either audio or text is required for auto-recognition" });
    }

    contents.push(promptText);

    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
      },
    }));

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      title: parsed.title || "Unspecified Issue",
      description: parsed.description || parsed.transcription || "Described via voice memo.",
      category: parsed.category || "Other",
      urgency: parsed.urgency || "medium",
      confidence: parsed.confidence || 80,
      transcription: parsed.transcription || ""
    });

  } catch (e: any) {
    const isQuota = e?.message?.includes("quota") || e?.message?.includes("Quota") || e?.status === 429;
    if (isQuota) {
      console.warn("Auto recognize hit rate limit/quota, using intelligent mock.");
    } else {
      console.warn("Auto recognize failed, using intelligent mock:", e?.message || e);
    }
    const isWater = text?.toLowerCase().includes("water") || text?.toLowerCase().includes("leak");
    const isRoad = text?.toLowerCase().includes("pot") || text?.toLowerCase().includes("road") || text?.toLowerCase().includes("hole");
    const isTrash = text?.toLowerCase().includes("trash") || text?.toLowerCase().includes("dump") || text?.toLowerCase().includes("garbage");
    
    return res.json({
      title: isWater ? "Water Utility Issue" : isRoad ? "Road Damage Pothole" : isTrash ? "Illegal Waste Dumping" : "Public Hazard Alert",
      description: text || "Processed via local speech-to-text algorithm. The reporter indicated a public safety issue on-site.",
      category: isWater ? "Water & Utilities" : isRoad ? "Road Safety & Potholes" : isTrash ? "Waste & Sanitation" : "Other",
      urgency: "medium",
      confidence: 75,
      transcription: "Voice memo captured successfully."
    });
  }
});

// POST create a new issue (with optional real-time Gemini categorization)
app.post("/api/issues", async (req, res) => {
  const { 
    title, 
    description, 
    address, 
    latitude, 
    longitude, 
    reporterId, 
    reporterName, 
    reporterContact,
    imageUrl, 
    audioUrl, 
    category, 
    urgency, 
    autoRecognized 
  } = req.body;

  if (!title || !description || !address) {
    return res.status(400).json({ error: "Title, description, and address are required" });
  }

  const newId = "issue-" + Date.now();
  
  // Default fallback AI analysis
  let aiAnalysis: AIAnalysis = {
    category: category || "Other",
    urgency: urgency || "medium",
    categoryExplanation: autoRecognized ? "Analyzed with AI Auto-Recognition." : "Manually specified by citizen.",
    suggestedResolutionSteps: [
      "Municipal inspector assigned to site check.",
      "Gather neighborhood feedback and secondary reports.",
      "Schedule sector corrective maintenance."
    ],
    priorityRationale: "Manual priority assigned.",
    riskScore: urgency === "critical" ? 90 : urgency === "high" ? 70 : urgency === "medium" ? 45 : 20
  };

  // Attempt Gemini API categorization if auto-recognition was requested or if we don't have a category
  const ai = getGeminiClient();
  if (ai && (autoRecognized || !category)) {
    try {
      const prompt = `Analyze this community report and categorize it. Return STRICTLY a JSON object conforming exactly to this structure:
{
  "category": "Road Safety & Potholes" | "Waste & Sanitation" | "Water & Utilities" | "Public Lights & Electrical" | "Other",
  "urgency": "low" | "medium" | "high" | "critical",
  "categoryExplanation": "A brief sentence explaining the classification.",
  "suggestedResolutionSteps": ["step 1", "step 2", "step 3"],
  "priorityRationale": "A brief sentence detailing why this urgency was selected.",
  "riskScore": number (value between 1 and 100)
}

Issue Title: ${title}
Description: ${description}
Location: ${address}`;

      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }));

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.category) {
        aiAnalysis = {
          category: parsed.category,
          urgency: parsed.urgency || "medium",
          categoryExplanation: parsed.categoryExplanation || "Categorized by Gemini Intelligence.",
          suggestedResolutionSteps: parsed.suggestedResolutionSteps || aiAnalysis.suggestedResolutionSteps,
          priorityRationale: parsed.priorityRationale || "Assessed dynamically.",
          riskScore: Number(parsed.riskScore) || 50
        };
      }
    } catch (e: any) {
      const isQuota = e?.message?.includes("quota") || e?.message?.includes("Quota") || e?.status === 429;
      if (isQuota) {
        console.warn("Gemini classification hit rate limit/quota, using fallback.");
      } else {
        console.warn("Gemini classification failed, using fallback:", e?.message || e);
      }
    }
  }

function getBlueprintRequirement(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("road") || cat.includes("pothole") || cat.includes("civil") || cat.includes("masonry")) {
    return "🧱 CIVIL MASONRY GUILD REQUIRED";
  } else if (cat.includes("water") || cat.includes("utility") || cat.includes("hydrology") || cat.includes("drainage")) {
    return "💧 HYDROLOGY BLUEPRINT REQUIRED";
  } else if (cat.includes("light") || cat.includes("electrical") || cat.includes("power") || cat.includes("grid")) {
    return "⚡ POWER GRID PROTOCOL REQUIRED";
  } else if (cat.includes("waste") || cat.includes("sanitation") || cat.includes("trash")) {
    return "♻️ SANITATION DEPLOYMENT REQUIRED";
  } else {
    return "⚙️ TECHNICAL SERVICES DIVISION REQUIRED";
  }
}

  const blueprintReq = getBlueprintRequirement(aiAnalysis.category);

  const newIssue: Issue = {
    id: newId,
    title,
    description,
    category: aiAnalysis.category,
    status: "reported",
    urgency: aiAnalysis.urgency,
    latitude: Number(latitude) || 37.7800,
    longitude: Number(longitude) || -122.4100,
    address,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
    audioUrl,
    reporterId: reporterId || "user-test",
    reporterName: reporterName || "Alex Carter",
    reporterContact,
    autoRecognized: !!autoRecognized,
    upvotesCount: 0,
    upvotedBy: [],
    downvotesCount: 0,
    downvotedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    aiAnalysis,
    consumerId: reporterId || "user-test",
    providerId: "",
    blueprintRequirement: blueprintReq,
    conversationIds: []
  };

  issues.unshift(newIssue);

  // Synchronize with MongoDB Issue collection using Mongoose Schema
  if (mongoose.connection.readyState === 1) {
    try {
      await MongooseIssue.create({
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category,
        status: newIssue.status,
        urgency: newIssue.urgency,
        latitude: newIssue.latitude,
        longitude: newIssue.longitude,
        address: newIssue.address,
        imageUrl: newIssue.imageUrl,
        audioUrl: newIssue.audioUrl,
        consumerId: newIssue.consumerId,
        providerId: newIssue.providerId,
        upvotesCount: 0,
        upvotedBy: [],
        downvotesCount: 0,
        downvotedBy: [],
        priorityScore: aiAnalysis.riskScore || 45,
        priorityLevel: aiAnalysis.urgency,
        interestCount: 0,
        supporters: [],
        comments: [],
        aiAnalysis: {
          category: aiAnalysis.category,
          urgency: aiAnalysis.urgency,
          categoryExplanation: aiAnalysis.categoryExplanation,
          suggestedResolutionSteps: aiAnalysis.suggestedResolutionSteps,
          priorityRationale: aiAnalysis.priorityRationale,
          riskScore: aiAnalysis.riskScore
        },
        conversationIds: []
      });
      console.log(`Mongoose: Issue ${newId} created successfully in MongoDB.`);
    } catch (err: any) {
      console.warn("Mongoose: MongoDB Issue creation warning:", err.message);
    }
  }

  // Award gamification points to reporter
  if (reporterId && userProfiles[reporterId]) {
    userProfiles[reporterId].points += 30; // 30 points for submitting a report
    userProfiles[reporterId].reportsCount += 1;
    
    // Check for "First Reporter" badge
    const hasBadge = userProfiles[reporterId].badges.some(b => b.id === "badge-1");
    if (!hasBadge) {
      userProfiles[reporterId].badges.push({
        id: "badge-1",
        name: "First Reporter",
        description: "Successfully flagged your first community issue",
        icon: "Flag",
        color: "text-blue-500 bg-blue-50",
        unlockedAt: new Date().toISOString()
      });
    }
  }

  res.status(201).json(newIssue);
});

// PATCH to upvote/verify an issue
app.patch("/api/issues/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Toggle upvote
  if (issue.upvotedBy.includes(userId)) {
    issue.upvotedBy = issue.upvotedBy.filter(uid => uid !== userId);
    issue.upvotesCount = Math.max(0, issue.upvotesCount - 1);
  } else {
    issue.upvotedBy.push(userId);
    issue.upvotesCount += 1;

    // Remove from downvote if present
    if (issue.downvotedBy.includes(userId)) {
      issue.downvotedBy = issue.downvotedBy.filter(uid => uid !== userId);
      issue.downvotesCount = Math.max(0, issue.downvotesCount - 1);
    }

    // Award verification points to verifying citizen
    if (userProfiles[userId]) {
      userProfiles[userId].points += 10; // 10 points for verification
      userProfiles[userId].verificationsCount += 1;

      // Check for "Eagle Eye" badge
      const hasEagleEye = userProfiles[userId].badges.some(b => b.id === "badge-2");
      if (!hasEagleEye && userProfiles[userId].verificationsCount >= 3) {
        userProfiles[userId].badges.push({
          id: "badge-2",
          name: "Eagle Eye",
          description: "Verified 3 community issues accurately",
          icon: "Eye",
          color: "text-emerald-500 bg-emerald-50",
          unlockedAt: new Date().toISOString()
        });
      }

      // Check for "Community Pillar" badge
      const hasPillar = userProfiles[userId].badges.some(b => b.id === "badge-3");
      if (!hasPillar && userProfiles[userId].points >= 200) {
        userProfiles[userId].badges.push({
          id: "badge-3",
          name: "Community Pillar",
          description: "Contributed over 200 points to local coordination",
          icon: "Award",
          color: "text-amber-500 bg-amber-50",
          unlockedAt: new Date().toISOString()
        });
      }
    }
  }

  // Auto-upgrade status to 'verified' if it has enough citizen support
  if (issue.status === "reported" && issue.upvotesCount >= 3) {
    issue.status = "verified";
  }

  issue.updatedAt = new Date().toISOString();
  res.json(issue);
});

// PATCH to downvote/flag an issue
app.patch("/api/issues/:id/downvote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.downvotedBy.includes(userId)) {
    issue.downvotedBy = issue.downvotedBy.filter(uid => uid !== userId);
    issue.downvotesCount = Math.max(0, issue.downvotesCount - 1);
  } else {
    issue.downvotedBy.push(userId);
    issue.downvotesCount += 1;

    // Remove from upvote if present
    if (issue.upvotedBy.includes(userId)) {
      issue.upvotedBy = issue.upvotedBy.filter(uid => uid !== userId);
      issue.upvotesCount = Math.max(0, issue.upvotesCount - 1);
    }
  }

  issue.updatedAt = new Date().toISOString();
  res.json(issue);
});

// PATCH to join interest on an issue (increments interestCount, updates supporters, recalculates score)
app.patch("/api/issues/:id/join-interest", (req, res) => {
  const { id } = req.params;
  const { userId, userName, userAvatar } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Ensure interestCount and supporters list are initialized
  if (issue.interestCount === undefined) {
    issue.interestCount = 0;
  }
  if (!issue.supporters) {
    issue.supporters = [];
  }

  // Check if user is already a supporter
  const alreadySupporter = issue.supporters.some(s => s.userId === userId);
  
  if (alreadySupporter) {
    // Leave interest group
    issue.supporters = issue.supporters.filter(s => s.userId !== userId);
    issue.interestCount = Math.max(0, issue.interestCount - 1);
  } else {
    // Join interest group
    issue.supporters.push({
      userId,
      userName: userName || "Anonymous Citizen",
      avatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      joinedAt: new Date().toISOString()
    });
    issue.interestCount += 1;

    // Award bonus points for interest support
    if (userProfiles[userId]) {
      userProfiles[userId].points += 15; // 15 points for joining interest group
    }
  }

  issue.updatedAt = new Date().toISOString();
  res.json(issue);
});

// PATCH to update status (Admin or Simulator helper)
app.patch("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, officialComment } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  issue.status = status;
  issue.updatedAt = new Date().toISOString();

  if (officialComment) {
    issue.comments.push({
      id: "comm-status-" + Date.now(),
      userId: "user-city-rep",
      userName: "District Coordinator",
      userAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&q=80",
      content: officialComment,
      createdAt: new Date().toISOString(),
      isOfficialResponse: true
    });
  }

  res.json(issue);
});

// PUT to accept an issue (Elite Architect)
app.put("/api/issues/:id/accept", async (req, res) => {
  const { id } = req.params;
  const { userId, userName, userAvatar } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing architect userId" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const now = new Date();
  issue.status = "assigned";
  issue.providerId = userId;
  issue.acceptedAt = now.toISOString() as any;

  // Decide dynamic timeline based on urgency
  let durationMinutes = 3; // Default for critical is 3 minutes for easy testing
  if (issue.urgency === "critical") durationMinutes = 3;
  else if (issue.urgency === "high") durationMinutes = 5;
  else if (issue.urgency === "medium") durationMinutes = 8;
  else if (issue.urgency === "low") durationMinutes = 12;

  const deadline = new Date(now.getTime() + durationMinutes * 60 * 1000);
  issue.deadlineAt = deadline.toISOString() as any;
  issue.updatedAt = now.toISOString();

  // Create official system response comment with countdown timeline details
  const systemComment: Comment = {
    id: "system-accept-" + Date.now(),
    userId: userId,
    userName: userName || "Elite Architect",
    userAvatar: userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    content: `🛠️ ELITE DESIGNATION ACCEPTED: Elite Architect ${userName || "Specialist"} has officially accepted this community report. Direct communication channel open.
⏱️ WORK TIMELINE ENGAGED: Resolution has been allocated a strict window of ${durationMinutes} minutes. Completion must be certified before ${deadline.toLocaleTimeString()} to earn full points (+100 XP). After expiration, low loss margin rules apply (+35 XP reward).`,
    createdAt: new Date().toISOString(),
    isOfficialResponse: true
  };
  issue.comments.unshift(systemComment);

  // Sync to Mongoose MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      await MongooseIssue.findOneAndUpdate(
        { id },
        { 
          status: "assigned", 
          providerId: userId, 
          acceptedAt: issue.acceptedAt, 
          deadlineAt: issue.deadlineAt, 
          $push: { comments: systemComment } 
        }
      );
      console.log(`Mongoose: Issue ${id} accepted in MongoDB by ${userId} with timeline deadline ${issue.deadlineAt}`);
    } catch (err: any) {
      console.warn("Mongoose MongoDB Sync warning:", err.message);
    }
  }

  res.json(issue);
});

// PUT to resolve an issue (Elite Architect)
app.put("/api/issues/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { userId, userName, userAvatar, resolutionNotes } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing architect userId" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const now = new Date();
  issue.status = "resolved";
  issue.resolvedAt = now.toISOString() as any;
  issue.updatedAt = now.toISOString();

  // Evaluate performance-based points deduction under low loss margin rule
  let isUnderTimeline = true;
  if (issue.deadlineAt) {
    const deadlineTime = new Date(issue.deadlineAt).getTime();
    if (now.getTime() > deadlineTime) {
      isUnderTimeline = false;
    }
  }

  const pointsAwarded = isUnderTimeline ? 100 : 35;
  issue.pointsEarned = pointsAwarded;

  // Create resolution comment reflecting the timeline and points earned
  const performanceMessage = isUnderTimeline
    ? `🏆 TIMELINE BONUS SECURED: Task completed within the safety deadline! Full points (+100 XP) successfully awarded to Elite Architect ${userName || "Specialist"}.`
    : `⚠️ TIMELINE EXPIRED: Resolution completed outside the strict safety deadline. Points awarded under low loss margin rule (+35 XP instead of +100 XP) to Elite Architect ${userName || "Specialist"}.`;

  const resolutionComment: Comment = {
    id: "system-resolve-" + Date.now(),
    userId: userId,
    userName: userName || "Elite Architect",
    userAvatar: userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    content: `✅ HAZARD RESOLVED: ${resolutionNotes || "The reported structural issue has been completely repaired, audited, and cleared for safe public passage."}\n\n${performanceMessage}`,
    createdAt: new Date().toISOString(),
    isOfficialResponse: true
  };
  issue.comments.unshift(resolutionComment);

  // Award points to the problem-solving Elite Architect
  if (userProfiles[userId]) {
    userProfiles[userId].points += pointsAwarded;
  }

  // Sync to Mongoose MongoDB
  if (mongoose.connection.readyState === 1) {
    try {
      await MongooseIssue.findOneAndUpdate(
        { id },
        { 
          status: "resolved", 
          resolvedAt: issue.resolvedAt, 
          pointsEarned: issue.pointsEarned, 
          $push: { comments: resolutionComment } 
        }
      );
      // Sync points
      await User.findOneAndUpdate(
        { id: userId },
        { $inc: { points: pointsAwarded } }
      );
      console.log(`Mongoose: Issue ${id} resolved in MongoDB by ${userId} with pointsAwarded ${pointsAwarded}`);
    } catch (err: any) {
      console.warn("Mongoose MongoDB Sync warning:", err.message);
    }
  }

  res.json(issue);
});

// POST a live chat message (Provider-Consumer Chat)
app.post("/api/issues/:id/chat", async (req, res) => {
  const { id } = req.params;
  const { senderId, senderName, senderAvatar, content } = req.body;

  if (!senderId || !content) {
    return res.status(400).json({ error: "Missing senderId or message content" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newMessage = {
    id: "msg-" + Date.now(),
    userId: senderId,
    userName: senderName || "Citizen Advocate",
    userAvatar: senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    content: content,
    createdAt: new Date().toISOString(),
    isOfficialResponse: false
  };

  // Push message as a comment on the issue so that it shows on the UI thread automatically!
  issue.comments.push(newMessage);
  issue.updatedAt = new Date().toISOString();

  // Sync message to Mongoose Conversation Model
  if (mongoose.connection.readyState === 1) {
    try {
      await Conversation.findOneAndUpdate(
        { issueId: id },
        { 
          $addToSet: { participants: senderId },
          $push: { messages: {
            id: newMessage.id,
            senderId: newMessage.userId,
            senderName: newMessage.userName,
            senderAvatar: newMessage.userAvatar,
            content: newMessage.content,
            createdAt: new Date(newMessage.createdAt)
          }}
        },
        { upsert: true, new: true }
      );
      console.log(`Mongoose: Chat message stored in MongoDB Conversation for issue ${id}`);
    } catch (err: any) {
      console.warn("Mongoose Conversation Sync warning:", err.message);
    }
  }

  res.status(201).json(issue);
});

// POST a comment
app.post("/api/issues/:id/comments", (req, res) => {
  const { id } = req.params;
  const { userId, userName, userAvatar, content, isOfficialResponse } = req.body;

  if (!userId || !userName || !content) {
    return res.status(400).json({ error: "Missing required comment fields" });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newComment: Comment = {
    id: "comm-" + Date.now(),
    userId,
    userName,
    userAvatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    content,
    createdAt: new Date().toISOString(),
    isOfficialResponse: !!isOfficialResponse
  };

  issue.comments.push(newComment);
  issue.updatedAt = new Date().toISOString();

  // Award gamification points for positive coordination (comments)
  if (userProfiles[userId]) {
    userProfiles[userId].points += 5;
  }

  res.status(201).json(issue);
});

// GET predictive planning insights from Gemini (AI Urban Risk Engine) - DEPRECATED
app.get("/api/insights", (req, res) => {
  res.json([]);
});

// POST to dynamically rank/prioritize unresolved issues for city officials
app.post("/api/ai/prioritize", async (req, res) => {
  const { 
    severityWeight = 25, 
    urgencyWeight = 25, 
    dangerWeight = 25, 
    affectedUsersWeight = 25 
  } = req.body;

  const unresolvedIssues = issues.filter(i => i.status !== "resolved");

  if (unresolvedIssues.length === 0) {
    return res.json([]);
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const issueDataText = unresolvedIssues.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        urgency: i.urgency,
        upvotes: i.upvotesCount,
        interestCount: i.interestCount || 0,
        address: i.address,
        latitude: i.latitude,
        longitude: i.longitude
      }));

      const prompt = `You are an expert urban planning and public dispatch AI model. 
Evaluate and prioritize the following list of active, unresolved community issues to assist city officials.
You must return a ranked list based on the customized priority weights supplied by the city administration:
- Severity Weight: ${severityWeight}% (representing structural/functional scale of the issue)
- Urgency Weight: ${urgencyWeight}% (representing time-critical nature or user-flagged urgency)
- Potential Danger Weight: ${dangerWeight}% (representing environmental, physical, or security hazards)
- Affected Users Weight: ${affectedUsersWeight}% (representing number of citizens affected, upvotes, and custom user interest counts)

Ensure each issue's priorityScore (0-100) mathematically aligns with these custom weights, taking interestCount and upvotes as crucial signals for Affected Users Weight.

Return STRICTLY a JSON array where each item is an object conforming to this exact structure:
[
  {
    "id": "the exact issue ID",
    "rank": 1,
    "title": "Title of issue",
    "priorityScore": 95,
    "priorityLevel": "Critical" | "High" | "Medium" | "Low",
    "rationale": "Comprehensive reasoning detailing how severity, urgency, danger, and affected citizens/interestCount influenced this rank and score.",
    "suggestedResourceAllocation": "Specific city department/team and quick resolution steps."
  }
]

Here are the unresolved issues to analyze:
${JSON.stringify(issueDataText, null, 2)}`;

      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      }));

      const text = response.text || "[]";
      const cleanedText = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
      const parsed = JSON.parse(cleanedText || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json(parsed);
      }
    } catch (e: any) {
      const isQuota = e?.message?.includes("quota") || e?.message?.includes("Quota") || e?.status === 429;
      if (isQuota) {
        console.warn("Gemini prioritization hit rate limit/quota, using programmatic ranking.");
      } else {
        console.warn("Gemini prioritization failed, using programmatic ranking:", e?.message || e);
      }
    }
  }

  // Fallback programmatic ranking algorithm if Gemini fails or is not configured
  const prioritized = unresolvedIssues.map(i => {
    // 1. Severity Score (0-100)
    let sevScore = 50;
    if (i.category.includes("Water") || i.category.includes("Utility")) sevScore = 85;
    else if (i.category.includes("Road") || i.category.includes("Pothole")) sevScore = 80;
    else if (i.category.includes("Light") || i.category.includes("Electrical")) sevScore = 65;
    else if (i.category.includes("Waste") || i.category.includes("Sanitation")) sevScore = 60;

    // 2. Urgency Score (0-100)
    let urgScore = 20;
    if (i.urgency === "critical") urgScore = 100;
    else if (i.urgency === "high") urgScore = 80;
    else if (i.urgency === "medium") urgScore = 50;

    // 3. Potential Danger Score (0-100)
    let dngScore = 40;
    if (i.category.includes("Road") || i.category.includes("Pothole") || i.urgency === "critical") dngScore = 90;
    else if (i.category.includes("Light") || i.category.includes("Electrical")) dngScore = 75;
    else if (i.category.includes("Water") || i.category.includes("Utility")) dngScore = 60;

    // 4. Affected Users Score (0-100)
    const interestBoost = (i.interestCount || 0) * 15;
    const affScore = Math.min(100, (i.upvotesCount || 0) * 10 + 15 + interestBoost);

    // Weighted average
    const finalScore = Math.round(
      (sevScore * severityWeight +
       urgScore * urgencyWeight +
       dngScore * dangerWeight +
       affScore * affectedUsersWeight) / 100
    );

    let priorityLevel: "Critical" | "High" | "Medium" | "Low" = "Low";
    if (finalScore >= 80) priorityLevel = "Critical";
    else if (finalScore >= 60) priorityLevel = "High";
    else if (finalScore >= 40) priorityLevel = "Medium";

    const rationale = `Calculated priority index of ${finalScore}/100 based on weighted metrics: Severity (${sevScore}), Urgency (${urgScore}), Potential Danger (${dngScore}), and Affected Citizens (${affScore}, including interest boost of +${interestBoost}). Located near ${i.address.split('(')[0]} with ${i.upvotesCount} community verifications and ${i.interestCount || 0} interested citizens.`;
    
    const suggestedResourceAllocation = i.category.includes("Water") 
      ? "Municipal Water Works - Inspect and repair fractured valve collars." 
      : i.category.includes("Road") 
      ? "Department of Transportation Maintenance - Apply structural cold-mix patch to asphalt."
      : i.category.includes("Light")
      ? "District Grid Maintenance Division - Dispatch field electrician to replace fixture bulb."
      : "Parks & Sanitation Dispatch - Deploy solid waste recovery crew.";

    return {
      id: i.id,
      title: i.title,
      priorityScore: finalScore,
      priorityLevel,
      rationale,
      suggestedResourceAllocation
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  res.json(prioritized);
});

// GET community leaderboards
app.get("/api/leaderboard", (req, res) => {
  const sorted = Object.values(userProfiles).map(user => ({
    ...user,
    badges: getDynamicBadgesForUser(user.id, user.badges)
  })).sort((a, b) => b.points - a.points);
  res.json(sorted);
});

// RESET database to initial seed data (Helper feature)
app.post("/api/system/reset", (req, res) => {
  issues = [...seedIssues];
  // Re-seed tester profile
  userProfiles["user-test"] = {
    id: "user-test",
    name: "Alex Carter",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    points: 120,
    reportsCount: 1,
    verificationsCount: 3,
    badges: [
      {
        id: "badge-1",
        name: "First Reporter",
        description: "Successfully flagged your first community issue",
        icon: "Flag",
        color: "text-blue-500 bg-blue-50",
        unlockedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "badge-2",
        name: "Eagle Eye",
        description: "Verified 3 community issues accurately",
        icon: "Eye",
        color: "text-emerald-500 bg-emerald-50",
        unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
  res.json({ message: "System reset successful", issues, userProfiles });
});

// Setup Vite & Static Fallbacks
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
