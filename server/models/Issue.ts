import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
  isOfficialResponse: boolean;
}

export interface ISupporter {
  userId: string;
  userName: string;
  avatar: string;
  joinedAt: Date;
}

export interface IAIAnalysis {
  category: string;
  urgency: string;
  categoryExplanation: string;
  suggestedResolutionSteps: string[];
  priorityRationale: string;
  riskScore: number;
}

export interface IIssue extends Document {
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
  consumerId: string; // Citizen Advocate
  providerId?: string; // Elite Architect
  upvotesCount: number;
  upvotedBy: string[];
  downvotesCount: number;
  downvotedBy: string[];
  priorityScore: number;
  priorityLevel: string;
  interestCount: number;
  supporters: ISupporter[];
  comments: IComment[];
  aiAnalysis?: IAIAnalysis;
  conversationIds: string[];
  acceptedAt?: Date;
  deadlineAt?: Date;
  resolvedAt?: Date;
  pointsEarned?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isOfficialResponse: { type: Boolean, default: false }
});

const SupporterSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  avatar: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now }
});

const AIAnalysisSchema = new Schema({
  category: { type: String },
  urgency: { type: String },
  categoryExplanation: { type: String },
  suggestedResolutionSteps: { type: [String] },
  priorityRationale: { type: String },
  riskScore: { type: Number }
});

const IssueSchema = new Schema<IIssue>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ["reported", "verified", "assigned", "in_progress", "resolved"], default: "reported" },
  urgency: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true },
  imageUrl: { type: String },
  imageUrls: { type: [String], default: [] },
  audioUrl: { type: String },
  consumerId: { type: String, required: true },
  providerId: { type: String },
  upvotesCount: { type: Number, default: 0 },
  upvotedBy: { type: [String], default: [] },
  downvotesCount: { type: Number, default: 0 },
  downvotedBy: { type: [String], default: [] },
  priorityScore: { type: Number, default: 45 },
  priorityLevel: { type: String, default: "Medium" },
  interestCount: { type: Number, default: 0 },
  supporters: { type: [SupporterSchema], default: [] },
  comments: { type: [CommentSchema], default: [] },
  aiAnalysis: { type: AIAnalysisSchema },
  conversationIds: { type: [String], default: [] },
  acceptedAt: { type: Date },
  deadlineAt: { type: Date },
  resolvedAt: { type: Date },
  pointsEarned: { type: Number }
}, { timestamps: true });

export const Issue = (mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema)) as mongoose.Model<IIssue>;
