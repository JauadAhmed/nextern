import PusherServer from 'pusher';

// ── Server instance ─────────────────────────────────────────
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// ── Channel helpers ─────────────────────────────────────────
export function userChannel(userId: string): string {
  return `user-${userId}`;
}

// ── Events ──────────────────────────────────────────────────
export const PUSHER_EVENTS = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  NEW_MESSAGE: 'new-message',
} as const;
