import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'job_match'
  | 'deadline_reminder'
  | 'status_update'
  | 'recommendation_request'
  | 'message_received'
  | 'badge_earned'
  | 'score_update'
  | 'advisor_note'
  | 'assessment_assigned'
  | 'interview_scheduled'
  | 'application_received'
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'review_received'
  | 'freelance_order'
  | 'payment_received'
  | 'support_message'
  | 'admin_message'
  | 'system_message';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string; // in-app route
  isRead: boolean;
  meta: Record<string, unknown>; // {jobId, applicationId, badgeSlug} etc.
  isEmailSent: boolean;
  expiresAt?: Date; // set to deadline date for deadline_reminder type
  // MongoDB TTL index auto-deletes after this date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed, default: {} },
    isEmailSent: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// MongoDB auto-deletes the document when expiresAt passes
// Only set expiresAt on deadline_reminder notifications
// Leave expiresAt undefined on permanent notifications (badge_earned, status_update etc.)

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
