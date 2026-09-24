import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('accessToken', accessToken, {
    ...baseCookie,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    ...baseCookie,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { ...baseCookie });
  res.clearCookie('refreshToken', { ...baseCookie });
}
