import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { userRepository } from '../repositories/user.repository.js';
import { loginSchema, registerSchema, userUpdateSchema } from '../validators/auth.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../validators/common.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res, next) => {
    const userCount = await userRepository.count();
    if (userCount === 0) {
      return authController.register(req, res, next);
    }

    return authenticate(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      adminOnly(req, res, (authzError) => {
        if (authzError) {
          next(authzError);
          return;
        }
        void authController.register(req, res, next);
      });
    });
  }),
);

authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/users', authenticate, adminOnly, validate(registerSchema), authController.createUser);
authRouter.get('/users', authenticate, adminOnly, authController.listUsers);
authRouter.patch('/users/:id', authenticate, adminOnly, validate(idParamSchema, 'params'), validate(userUpdateSchema), authController.updateUser);
authRouter.delete('/users/:id', authenticate, adminOnly, validate(idParamSchema, 'params'), authController.deleteUser);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
