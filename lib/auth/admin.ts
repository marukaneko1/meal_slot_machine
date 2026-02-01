'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/db';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validates admin password and creates a session
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { success: false, error: 'Admin password not configured on server' };
  }

  if (password !== adminPassword) {
    return { success: false, error: 'Invalid password' };
  }

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: { token, expiresAt },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return { success: true };
}

/**
 * Validates the current admin session
 * NOTE: Admin authentication is disabled - always returns true
 */
export async function validateAdminSession(): Promise<boolean> {
  // Admin authentication disabled - all routes are public
  return true;
}

/**
 * Logs out the current admin session
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Generates a random session token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Cleans up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}
