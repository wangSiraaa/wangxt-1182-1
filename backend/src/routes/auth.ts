import { Router } from 'express';
import Joi from 'joi';
import { User } from '../models';
import { AuthRequest, generateToken, authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { UserRole } from '../types/enums';

const router = Router();

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名不能为空',
  }),
  password: Joi.string().required().messages({
    'any.required': '密码不能为空',
  }),
});

router.post(
  '/login',
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({
        where: { username },
      });

      if (!user) {
        return errorResponse(res, '用户名或密码错误', 401);
      }

      if (!user.isActive) {
        return errorResponse(res, '账号已被禁用，请联系管理员', 403);
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return errorResponse(res, '用户名或密码错误', 401);
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        orgName: user.orgName,
      });

      return successResponse(
        res,
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            orgName: user.orgName,
          },
        },
        '登录成功'
      );
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  return successResponse(res, req.user, '获取用户信息成功');
});

router.post('/logout', authMiddleware, (req: AuthRequest, res) => {
  return successResponse(res, null, '登出成功');
});

export default router;
