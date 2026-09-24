import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/auth.service.js';
import { userDirectoryService } from '../services/userDirectory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js';

export const authController = {
  listUsers: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userDirectoryService.listAll();
    res.status(StatusCodes.OK).json({ users });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(StatusCodes.CREATED).json({ user: result.user });
  }),

  createUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.createUser(req.body);
    res.status(StatusCodes.CREATED).json({ user });
  }),

  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateUser(req.params.id!, req.body);
    res.status(StatusCodes.OK).json({ user });
  }),

  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    await authService.deleteUser(req.params.id!, req.user!.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(StatusCodes.OK).json({ user: result.user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.cookies?.refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(StatusCodes.OK).json({ user: result.user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await authService.logout(req.user.id, req.cookies?.refreshToken);
    }
    clearAuthCookies(res);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    res.status(StatusCodes.OK).json({ user });
  }),
};
