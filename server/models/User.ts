import mongoose, { Schema, Document } from "mongoose";

export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
}

export interface IUser extends Document {
  name: string;
  contact?: string;
  avatar: string;
  points: number;
  reportsCount: number;
  verificationsCount: number;
  role: "citizen" | "architect";
  specialty?: string;
  badges: IBadge[];
}

const BadgeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  contact: { type: String },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
  points: { type: Number, default: 0 },
  reportsCount: { type: Number, default: 0 },
  verificationsCount: { type: Number, default: 0 },
  role: { type: String, enum: ["citizen", "architect"], default: "citizen" },
  specialty: { type: String },
  badges: { type: [BadgeSchema], default: [] }
}, { timestamps: true });

export const User = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as mongoose.Model<IUser>;
