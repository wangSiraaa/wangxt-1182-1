import { Router } from 'express';
import Joi from 'joi';
import { ApprovalRecord } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { ApprovalStatus, ApprovalType, UserRole } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      approvalType: Joi.string().allow('', null),
      approvalStatus: Joi.string().allow('', null),
      initiatorId: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { approvalType, approvalStatus, initiatorId } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (approvalType) {
        where.approvalType = approvalType;
      }
      if (approvalStatus) {
        where.approvalStatus = approvalStatus;
      }
      if (initiatorId) {
        where.initiatorId = initiatorId;
      }

      const { count, rows } = await ApprovalRecord.findAndCountAll({
        where,
        offset,
        limit,
        order: [['initiatedAt', 'DESC']],
      });

      return successResponse(
        res,
        rows,
        '查询成功',
        { total: count, page, pageSize }
      );
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const record = await ApprovalRecord.findByPk(req.params.id);

    if (!record) {
      return errorResponse(res, '审批记录不存在', 404);
    }

    return successResponse(res, record, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/approve',
  authMiddleware,
  requireRoles(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { approved, rejectionReason } = req.body;

      const record = await ApprovalRecord.findByPk(req.params.id);

      if (!record) {
        return errorResponse(res, '审批记录不存在', 404);
      }

      if (record.approvalStatus !== ApprovalStatus.PENDING) {
        return errorResponse(res, '该记录已被审批', 400);
      }

      await record.update({
        approvalStatus: approved
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED,
        approverId: user.id,
        approverName: user.name,
        approvedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      });

      return successResponse(res, record, approved ? '审批通过' : '审批驳回');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
