import { Router } from 'express';
import Joi from 'joi';
import { SampleBox, Document, TemperatureRecord, FlowLog, FreezeRecord } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams, buildSearchCondition } from '../utils/pagination';
import { SampleBoxStatus, UserRole, DocumentType, DocumentStatus } from '../types/enums';
import {
  executeTransition,
  canUpdateSubjectCode,
  getAvailableTransitions,
} from '../services/flowService';
import { Op, where } from 'sequelize';

const router = Router();

const createSampleBoxSchema = Joi.object({
  subjectCode: Joi.string().required().messages({
    'any.required': '受试者编码不能为空',
  }),
  studyNo: Joi.string().allow('', null),
  sampleCount: Joi.number().integer().min(0).default(0),
  sampleType: Joi.string().allow('', null),
  storageCondition: Joi.string().allow('', null),
  minTemp: Joi.number().allow(null),
  maxTemp: Joi.number().allow(null),
  ethicsApprovalNo: Joi.string().allow('', null),
  ethicsApprovalValidUntil: Joi.date().allow(null),
  remarks: Joi.string().allow('', null),
});

const updateSampleBoxSchema = Joi.object({
  subjectCode: Joi.string(),
  studyNo: Joi.string().allow('', null),
  sampleCount: Joi.number().integer().min(0),
  sampleType: Joi.string().allow('', null),
  storageCondition: Joi.string().allow('', null),
  minTemp: Joi.number().allow(null),
  maxTemp: Joi.number().allow(null),
  ethicsApprovalNo: Joi.string().allow('', null),
  ethicsApprovalValidUntil: Joi.date().allow(null),
  ethicsApprovalFile: Joi.string().allow('', null),
  ethicsApprovalVerified: Joi.boolean(),
  remarks: Joi.string().allow('', null),
});

const transitionSchema = Joi.object({
  toStatus: Joi.string().required().messages({
    'any.required': '目标状态不能为空',
  }),
  remark: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      keyword: Joi.string().allow('', null),
      status: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { keyword, status } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (keyword) {
        where[Op.or] = [
          { boxCode: { [Op.iLike]: `%${keyword}%` } },
          { subjectCode: { [Op.iLike]: `%${keyword}%` } },
          { studyNo: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await SampleBox.findAndCountAll({
        where,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Document,
            as: 'documents',
            required: false,
          },
        ],
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
    const sampleBox = await SampleBox.findByPk(req.params.id, {
      include: [
        {
          model: Document,
          as: 'documents',
        },
        {
          model: TemperatureRecord,
          as: 'temperatureRecords',
          order: [['recordedAt', 'DESC']],
          limit: 20,
        },
        {
          model: FlowLog,
          as: 'flowLogs',
          order: [['operatedAt', 'DESC']],
        },
        {
          model: FreezeRecord,
          as: 'freezeRecords',
          order: [['initiatedAt', 'DESC']],
        },
      ],
    });

    if (!sampleBox) {
      return errorResponse(res, '样本盒不存在', 404);
    }

    const availableTransitions = getAvailableTransitions(
      sampleBox.status as SampleBoxStatus,
      req.user!.role as UserRole
    );

    return successResponse(
      res,
      {
        ...sampleBox.toJSON(),
        availableTransitions,
        canUpdateSubjectCode: canUpdateSubjectCode(sampleBox),
      },
      '查询成功'
    );
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(createSampleBoxSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const boxCode = `SB${datePart}${randomPart}`;

      const sampleBox = await SampleBox.create({
        ...req.body,
        boxCode,
        researchCenterId: user.id,
        researchCenterName: user.orgName || user.name,
        status: SampleBoxStatus.DRAFT,
      });

      return successResponse(res, sampleBox, '样本盒创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(updateSampleBoxSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const sampleBox = await SampleBox.findByPk(req.params.id);

      if (!sampleBox) {
        return errorResponse(res, '样本盒不存在', 404);
      }

      if (req.body.subjectCode && !canUpdateSubjectCode(sampleBox)) {
        return errorResponse(res, '到样确认后不能修改受试者编码', 400);
      }

      await sampleBox.update(req.body);

      return successResponse(res, sampleBox, '样本盒更新成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/transition',
  authMiddleware,
  validateBody(transitionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { toStatus, remark } = req.body;

      const sampleBox = await executeTransition(
        req.params.id,
        toStatus,
        user.id,
        user.name,
        user.role as UserRole,
        { remark }
      );

      return successResponse(res, sampleBox, `状态流转成功`);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/flow-logs',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const logs = await FlowLog.findAll({
        where: { sampleBoxId: req.params.id },
        order: [['operatedAt', 'DESC']],
      });

      return successResponse(res, logs, '查询成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
