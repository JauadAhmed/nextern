import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function isAuthorizedCronRequest(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authorization = req.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
  const received = bearerToken ?? req.headers.get('x-cron-secret');

  return Boolean(received && secretsMatch(received, expected));
}
