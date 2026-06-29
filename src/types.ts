export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  isOfficialResponse: boolean;
}

export interface AIAnalysis {
  category: string;
  urgency: "low" | "medium" | "high" | "critical";
  categoryExplanation: string;
  suggestedResolutionSteps: string[];
  priorityRationale: string;
  riskScore: number; // 1 to 100
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "reported" | "verified" | "assigned" | "in_progress" | "resolved";
  urgency: "low" | "medium" | "high" | "critical";
  latitude: number;
  longitude: number;
  address: string;
  imageUrl?: string;
  imageUrls?: string[];
  audioUrl?: string;
  reporterId: string;
  reporterName: string;
  reporterContact?: string;
  autoRecognized?: boolean;
  upvotesCount: number;
  upvotedBy: string[]; // List of user IDs
  downvotesCount: number;
  downvotedBy: string[]; // List of user IDs
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  aiAnalysis: AIAnalysis | null;
  interestCount?: number;
  supporters?: { userId: string; userName: string; avatar: string; joinedAt: string }[];
  consumerId?: string;
  providerId?: string;
  blueprintRequirement?: string;
  conversationIds?: string[];
  acceptedAt?: string;
  deadlineAt?: string;
  resolvedAt?: string;
  pointsEarned?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  unlockedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  badges: Badge[];
  role?: "citizen" | "architect";
  specialty?: string;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  category: string;
  description: string;
  predictedRisk: "low" | "medium" | "high" | "critical";
  recommendation: string;
  affectedArea: string;
  latitude: number;
  longitude: number;
}

export interface DashboardStats {
  totalReported: number;
  totalResolved: number;
  totalInProgress: number;
  categoryDistribution: { name: string; value: number }[];
  resolutionRatesByMonth: { month: string; reported: number; resolved: number }[];
}
