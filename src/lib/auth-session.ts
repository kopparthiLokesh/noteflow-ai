import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getSessionCookie,
  verifySessionToken,
  hashSessionToken,
} from "@/lib/session";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      userId: payload.userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      userId: true,
    },
  });

  return session?.userId ?? null;
}
