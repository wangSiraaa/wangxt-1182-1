import { Router } from 'express';
import Joi from 'joi';
import {
  TemperatureReview,
  FreezeRecord,
  SampleBox,
  TemperatureRecord,
  FlowLog,
} from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import {
  UserRole,
  SampleBoxStatus,
  TemperatureReviewConclusion,
} from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const createReviewSchema = Joi.object({
  sampleBoxId: Joi.string().required().messages({
    'any.required': '样本盒ID不能为空',
  }),
  freezeRecordId: Joi.string().allow('', null),
  temperatureRecordId: Joi.string().allow('', null),
  conclusion: Joi.string()
    .valid(...Object.values(TemperatureReviewConclusion))
    .required()
    .messages({
      'any.required': '复核结论不能为空',
    }),
  conclusionDetail: Joi.string().allow('', null),
  maxExceededTemp: Joi.number().allow(null),
  minExceededTemp: Joi.number().allow(null),
  exceededDurationMinutes: Joi.number().integer().allow(null),
  isUsableAfterReview: Joi.boolean().allow(null),
  evidenceFiles: Joi.array().items(Joi.string()).allow(null),
  nextStep: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const addAbnormalConclusionSchema = Joi.object({
  abnormalConclusion: Joi.string().required().messages({
    'any.required': '异常结论不能为空',
  }),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      sampleBoxId: Joi.string().allow('', null),
      freezeRecordId: Joi.string().allow('', null),
      conclusion: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sampleBoxId, freezeRecordId, conclusion } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};
      if (sampleBoxId) where.sampleBoxId = sampleBoxId;
      if (freezeRecordId) where.freezeRecordId = freezeRecordId;
      if (conclusion) where.conclusion = conclusion;

      const { count, rows } = await TemperatureReview.findAndCountAll({
        where,
        offset,
        limit,
        order: [['reviewAt', 'DESC']],
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
    const review = await TemperatureReview.findByPk(req.params.id, {
      include: [
        {
          model: SampleBox,
          as: 'sampleBox',
          attributes: ['id', 'boxCode', 'subjectCode', 'status'],
        },
      ],
    });

    if (!review) {
      return errorResponse(res, '温度复核记录不存在', 404);
    }

    return successResponse(res, review, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(createReviewSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { sampleBoxId, freezeRecordId, conclusion, conclusionDetail } = req.body;

      const sampleBox = await SampleBox.findByPk(sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '样本盒不存在', 404);
      }

      const review = await TemperatureReview.create({
        ...req.body,
        reviewerId: user.id,
        reviewerName: user.name,
      });

      if (freezeRecordId) {
        const freezeRecord = await FreezeRecord.findByPk(freezeRecordId);
        if (freezeRecord) {
          await freezeRecord.update({
            abnormalConclusion: conclusionDetail,
            abnormalConclusionById: user.id,
            abnormalConclusionByName: user.name,
            abnormalConclusionAt: new Date(),
          });
        }
      }

      if (conclusion === TemperatureReviewConclusion.UNUSABLE) {
        await sampleBox.update({ status: SampleBoxStatus.DESTROYED });
        await FlowLog.create({
          sampleBoxId,
          fromStatus: sampleBox.status as SampleBoxStatus,
          toStatus: SampleBoxStatus.DESTROYED,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role as UserRole,
          operationType: 'temp_review_destroy',
          description: `温度复核结论：样本不可用 - ${conclusionDetail}`,
        });
      } else if (conclusion === TemperatureReviewConclusion.USABLE) {
        const oldStatus = sampleBox.status;
        await sampleBox.update({ status: SampleBoxStatus.THAWED });
        await FlowLog.create({
          sampleBoxId,
          fromStatus: oldStatus as SampleBoxStatus,
          toStatus: SampleBoxStatus.THAWED,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role as UserRole,
          operationType: 'temp_review_thaw',
          description: `温度复核结论：样本可用 - ${conclusionDetail}`,
        });
      }

      return successResponse(res, review, '温度复核记录创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/freeze-record/:freezeRecordId/abnormal-conclusion',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(addAbnormalConclusionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { freezeRecordId } = req.params;
      const { abnormalConclusion } = req.body;

      const freezeRecord = await FreezeRecord.findByPk(freezeRecordId);
      if (!freezeRecord) {
        return errorResponse(res, '冻结记录不存在', 404);
      }

      const sampleBox = await SampleBox.findByPk(freezeRecord.sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '关联样本盒不存在', 404);
      }

      if (sampleBox.subjectCodeLocked && req.body.subjectCode && req.body.subjectCode !== sampleBox.subjectCode) {
        return errorResponse(res, '到样确认后不能修改受试者编码，只能补充异常结论', 400);
      }

      await freezeRecord.update({
        abnormalConclusion,
        abnormalConclusionById: user.id,
        abnormalConclusionByName: user.name,
        abnormalConclusionAt: new Date(),
      });

      await FlowLog.create({
        sampleBoxId: freezeRecord.sampleBoxId,
        fromStatus: sampleBox.status as SampleBoxStatus,
        toStatus: sampleBox.status as SampleBoxStatus,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role as UserRole,
        operationType: 'add_abnormal_conclusion',
        description: `补充异常结论：${abnormalConclusion}`,
      });

      return successResponse(res, freezeRecord, '异常结论补充成功，受试者编码已锁定不可修改');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/freezing-records/:freezeRecordId/abnormal-conclusion',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.ADMIN),
  validateBody(addAbnormalConclusionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { freezeRecordId } = req.params;
      const { abnormalConclusion } = req.body;

      const freezeRecord = await FreezeRecord.findByPk(freezeRecordId);
      if (!freezeRecord) {
        return errorResponse(res, '冻结记录不存在', 404);
      }

      const sampleBox = await SampleBox.findByPk(freezeRecord.sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '关联样本盒不存在', 404);
      }

      if (sampleBox.subjectCodeLocked && req.body.subjectCode && req.body.subjectCode !== sampleBox.subjectCode) {
        return errorResponse(res, '到样确认后不能修改受试者编码，只能补充异常结论', 400);
      }

      await freezeRecord.update({
        abnormalConclusion,
        abnormalConclusionById: user.id,
        abnormalConclusionByName: user.name,
        abnormalConclusionAt: new Date(),
      });

      await FlowLog.create({
        sampleBoxId: freezeRecord.sampleBoxId,
        fromStatus: sampleBox.status as SampleBoxStatus,
        toStatus: sampleBox.status as SampleBoxStatus,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role as UserRole,
        operationType: 'add_abnormal_conclusion',
        description: `补充异常结论：${abnormalConclusion}`,
      });

      return successResponse(res, freezeRecord, '异常结论补充成功，受试者编码已锁定不可修改');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
