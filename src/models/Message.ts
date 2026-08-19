import mongoose, { Schema, Document } from 'mongoose';

export type SupportMessageType = 'support_message' | 'admin_message' | 'system_message';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  threadId: string; // [senderId,receiverId].sort().join('-')
  threadType?: 'direct' | 'freelance_order';
  content: string;
  isRead: boolean;
  readAt?: Date;
  isFlagged: boolean; // admin monitoring
  flagReason?: string;
  messageType?: SupportMessageType;
  templateType?: 'interview_invite' | 'rejection' | 'offer_letter' | null;
  attachmentUrl?: string; // Legacy Uploadthing URL
  attachments?: { url: string; name: string; type: string }[];
  relatedJobId?: mongoose.Types.ObjectId;
  relatedFreelanceOrderId?: mongoose.Types.ObjectId;
  editCount: number;
  deletedFor: mongoose.Types.ObjectId[];
  isDeletedForEveryone: boolean;
  forwardedFromId?: mongoose.Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true },
    threadType: { type: String, enum: ['direct', 'freelance_order'], default: 'direct' },
    content: { type: String, default: '', maxlength: 5000 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    messageType: {
      type: String,
      enum: ['support_message', 'admin_message', 'system_message'],
    },
    templateType: {
      type: String,
      enum: ['interview_invite', 'rejection', 'offer_letter', null],
      default: null,
    },
    attachmentUrl: { type: String },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    relatedJobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    relatedFreelanceOrderId: { type: Schema.Types.ObjectId, ref: 'FreelanceOrder' },
    editCount: { type: Number, default: 0 },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeletedForEveryone: { type: Boolean, default: false },
    forwardedFromId: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ relatedFreelanceOrderId: 1, createdAt: -1 });

export const Message =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
