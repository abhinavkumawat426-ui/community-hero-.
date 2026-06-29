import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: Date;
}

export interface IConversation extends Document {
  issueId: string;
  participants: string[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ConversationSchema = new Schema<IConversation>({
  issueId: { type: String, required: true },
  participants: { type: [String], required: true },
  messages: { type: [MessageSchema], default: [] }
}, { timestamps: true });

export const Conversation = (mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema)) as mongoose.Model<IConversation>;
