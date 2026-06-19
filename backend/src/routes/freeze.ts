import { Router } from 'express';
import Joi from 'joi';
import { FreezeRecord, SampleBox, FlowLog, ApprovalRecord } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { FreezeReason, UserRole, SampleBoxStatus, ApprovalStatus, ApprovalType } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const createFreezeSchema = Joi.object({
  sampleBoxId: Joi.string().required().messages({
    'any.required': '样本盒ID不能为空',
  }),
  freezeReason: Joi.string()
    .valid(...Object.values(FreezeReason))
    .required()
    .messages({
      'any.required': '冻结原因不能为空',
      'any.only': '冻结原因不合法',
    }),
  freezeReasonDetail: Joi.string().allow('', null),
  triggeredByTemperatureRecordId: Joi.string().allow('', null),
  triggeredByFlightId: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const approvalFreezeSchema = Joi.object({
  approved: Joi.boolean().required().messages({
    'any.required': '审批结果不能为空',
  }),
  rejectionReason: Joi.string().allow('', null),
});

const thawSchema = Joi.object({
  thawReason: Joi.string().required().messages({
    'any.required': '解冻原因不能为空',
  }),
});

const destroySchema = Joi.object({
  destroyReason: Joi.string().required().messages({
    'any.required': '销毁原因不能为空',
  }),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      sampleBoxId: Joi.string().allow('', null),
      approvalStatus: Joi.string().allow('', null),
      freezeReason: Joi.string().allow('', null),
      isThawed: Joi.boolean().allow(null),
      isDestroyed: Joi.boolean().allow(null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sampleBoxId, approvalStatus, freezeReason, isThawed, isDestroyed } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (sampleBoxId) {
        where.sampleBoxId = sampleBoxId;
      }
      if (approvalStatus) {
        where.approvalStatus = approvalStatus;
      }
      if (freezeReason) {
        where.freezeReason = freezeReason;
      }
      if (isThawed !== undefined && isThawed !== null) {
        where.isThawed = isThawed;
      }
      if (isDestroyed !== undefined && isDestroyed !== null) {
        where.isDestroyed = isDestroyed;
      }

      const { count, rows } = await FreezeRecord.findAndCountAll({
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
    const record = await FreezeRecord.findByPk(req.params.id);

    if (!record) {
      return errorResponse(res, '冻结记录不存在', 404);
    }

    return successResponse(res, record, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(createFreezeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { sampleBoxId } = req.body;

      const sampleBox = await SampleBox.findByPk(sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '样本盒不存在', 404);
      }

      if (sampleBox.status === SampleBoxStatus.FROZEN) {
        return errorResponse(res, '样本盒已处于冻结状态', 400);
      }

      const freezeRecord = await FreezeRecord.create({
        ...req.body,
        initiatedById: user.id,
        initiatedByName: user.name,
      });

      const oldStatus = sampleBox.status;
      await sampleBox.update({ status: SampleBoxStatus.FROZEN });

      await FlowLog.create({
        sampleBoxId,
        fromStatus: oldStatus as SampleBoxStatus,
        toStatus: SampleBoxStatus.FROZEN,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role as UserRole,
        operationType: 'manual_freeze',
        description: `人工冻结：${req.body.freezeReason}`,
        remark: req.body.remarks,
      });

      await ApprovalRecord.create({
        approvalType: ApprovalType.FREEZE,
        businessId: freezeRecord.id,
        businessType: 'freeze_record',
        title: `样本盒冻结审批 - ${sampleBox.boxCode}`,
        currentStatus: oldStatus as SampleBoxStatus,
        targetStatus: SampleBoxStatus.FROZEN,
        initiatorId: user.id,
        initiatorName: user.name,
      });

      return successResponse(res, freezeRecord, '冻结记录创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/approve',
  authMiddleware,
  requireRoles(UserRole.ADMIN),
  validateBody(approvalFreezeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { approved, rejectionReason } = req.body;

      const freezeRecord = await FreezeRecord.findByPk(req.params.id);
      if (!freezeRecord) {
        return errorResponse(res, '冻结记录不存在', 404);
      }

      if (freezeRecord.approvalStatus !== ApprovalStatus.PENDING) {
        return errorResponse(res, '该冻结记录已被审批', 400);
      }

      await freezeRecord.update({
        approvalStatus: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        approverId: user.id,
        approverName: user.name,
        approvedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      });

      if (!approved) {
        const sampleBox = await SampleBox.findByPk(freezeRecord.sampleBoxId);
        if (sampleBox && sampleBox.status === SampleBoxStatus.FROZEN) {
          await sampleBox.update({ status: SampleBoxStatus.TEMP_ABNORMAL });
          await FlowLog.create({
            sampleBoxId: freezeRecord.sampleBoxId,
            fromStatus: SampleBoxStatus.FROZEN,
            toStatus: SampleBoxStatus.TEMP_ABNORMAL,
            operatorId: user.id,
            operatorName: user.name,
            operatorRole: user.role as UserRole,
            operationType: 'approve_reject_unfreeze',
            description: `冻结审批驳回，样本盒恢复`,
          });
        }
      }

      return successResponse(res, freezeRecord, approved ? '审批通过' : '审批驳回');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/thaw',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(thawSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { thawReason } = req.body;

      const freezeRecord = await FreezeRecord.findByPk(req.params.id);
      if (!freezeRecord) {
        return errorResponse(res, '冻结记录不存在', 404);
      }

      if (freezeRecord.isThawed || freezeRecord.isDestroyed) {
        return errorResponse(res, '冻结记录已被解冻或销毁', 400);
      }

      await freezeRecord.update({
        isThawed: true,
        thawedById: user.id,
        thawedByName: user.name,
        thawedAt: new Date(),
        thawReason,
      });

      const sampleBox = await SampleBox.findByPk(freezeRecord.sampleBoxId);
      if (sampleBox) {
        const oldStatus = sampleBox.status;
        await sampleBox.update({ status: SampleBoxStatus.THAWED });
        await FlowLog.create({
          sampleBoxId: freezeRecord.sampleBoxId,
          fromStatus: oldStatus as SampleBoxStatus,
          toStatus: SampleBoxStatus.THAWED,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role as UserRole,
          operationType: 'thaw',
          description: `样本盒解冻：${thawReason}`,
        });
      }

      return successResponse(res, freezeRecord, '样本盒解冻成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/destroy',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(destroySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { destroyReason } = req.body;

      const freezeRecord = await FreezeRecord.findByPk(req.params.id);
      if (!freezeRecord) {
        return errorResponse(res, '冻结记录不存在', 404);
      }

      if (freezeRecord.isDestroyed) {
        return errorResponse(res, '冻结记录已被销毁', 400);
      }

      await freezeRecord.update({
        isDestroyed: true,
        destroyedById: user.id,
        destroyedByName: user.name,
        destroyedAt: new Date(),
        destroyReason,
      });

      const sampleBox = await SampleBox.findByPk(freezeRecord.sampleBoxId);
      if (sampleBox) {
        const oldStatus = sampleBox.status;
        await sampleBox.update({ status: SampleBoxStatus.DESTROYED });
        await FlowLog.create({
          sampleBoxId: freezeRecord.sampleBoxId,
          fromStatus: oldStatus as SampleBoxStatus,
          toStatus: SampleBoxStatus.DESTROYED,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role as UserRole,
          operationType: 'destroy',
          description: `样本盒销毁：${destroyReason}`,
        });
      }

      return successResponse(res, freezeRecord, '样本盒销毁成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
