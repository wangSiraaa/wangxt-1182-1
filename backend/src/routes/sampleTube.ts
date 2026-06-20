import { Router } from 'express';
import Joi from 'joi';
import { SampleTube, SampleBox } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { UserRole } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const createSampleTubeSchema = Joi.object({
  sampleBoxId: Joi.string().required().messages({
    'any.required': '样本盒ID不能为空',
  }),
  tubeCode: Joi.string().required().messages({
    'any.required': '样本管编号不能为空',
  }),
  subjectCode: Joi.string().required().messages({
    'any.required': '受试者编码不能为空',
  }),
  studyNo: Joi.string().allow('', null),
  sampleType: Joi.string().allow('', null),
  sampleVolume: Joi.number().allow(null),
  collectionDate: Joi.date().allow(null),
  storageCondition: Joi.string().allow('', null),
  minTemp: Joi.number().allow(null),
  maxTemp: Joi.number().allow(null),
  ethicsApprovalNo: Joi.string().allow('', null),
  seqNo: Joi.number().integer().min(1),
  remark: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      sampleBoxId: Joi.string().allow('', null),
      subjectCode: Joi.string().allow('', null),
      keyword: Joi.string().allow('', null),
      originalSampleBoxId: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(200),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sampleBoxId, subjectCode, keyword, originalSampleBoxId } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (sampleBoxId) {
        where.sampleBoxId = sampleBoxId;
      }
      if (originalSampleBoxId) {
        where.originalSampleBoxId = originalSampleBoxId;
      }
      if (subjectCode) {
        where.subjectCode = subjectCode;
      }
      if (keyword) {
        where[Op.or] = [
          { tubeCode: { [Op.iLike]: `%${keyword}%` } },
          { subjectCode: { [Op.iLike]: `%${keyword}%` } },
          { studyNo: { [Op.iLike]: `%${keyword}%` } },
          { ethicsApprovalNo: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await SampleTube.findAndCountAll({
        where,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
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
    const tube = await SampleTube.findByPk(req.params.id);

    if (!tube) {
      return errorResponse(res, '样本管不存在', 404);
    }

    return successResponse(res, tube, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(createSampleTubeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const sampleBox = await SampleBox.findByPk(req.body.sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '样本盒不存在', 404);
      }

      const tube = await SampleTube.create({
        ...req.body,
        ethicsApprovalNo: req.body.ethicsApprovalNo || sampleBox.ethicsApprovalNo,
        ethicsApprovalVerified: sampleBox.ethicsApprovalVerified,
      });

      const tubeCount = await SampleTube.count({
        where: { sampleBoxId: sampleBox.id },
      });
      await sampleBox.update({ sampleCount: tubeCount });

      return successResponse(res, tube, '样本管创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(createSampleTubeSchema.keys({
    sampleBoxId: Joi.string().optional(),
    tubeCode: Joi.string().optional(),
    subjectCode: Joi.string().optional(),
  })),
  async (req: AuthRequest, res, next) => {
    try {
      const tube = await SampleTube.findByPk(req.params.id);

      if (!tube) {
        return errorResponse(res, '样本管不存在', 404);
      }

      await tube.update(req.body);

      return successResponse(res, tube, '样本管更新成功');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/relation/mapping',
  authMiddleware,
  validateQuery(
    Joi.object({
      sampleBoxId: Joi.string().allow('', null),
      subjectCode: Joi.string().allow('', null),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sampleBoxId, subjectCode } = req.query;
      const where: any = {};
      if (sampleBoxId) where.sampleBoxId = sampleBoxId;
      if (subjectCode) where.subjectCode = subjectCode;

      const tubes = await SampleTube.findAll({
        where,
        order: [['sampleBoxId', 'ASC'], ['seqNo', 'ASC']],
        attributes: [
          'id',
          'tubeCode',
          'sampleBoxId',
          'subjectCode',
          'studyNo',
          'ethicsApprovalNo',
          'ethicsApprovalVerified',
          'seqNo',
          'sampleType',
          'originalSampleBoxId',
          'status',
        ],
      });

      const groupedByBox: Record<string, any[]> = {};
      for (const tube of tubes) {
        const key = tube.sampleBoxId;
        if (!groupedByBox[key]) {
          groupedByBox[key] = [];
        }
        groupedByBox[key].push(tube);
      }

      return successResponse(res, {
        tubes,
        groupedByBox,
      }, '盒号-样本号-伦理批件对应关系查询成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
