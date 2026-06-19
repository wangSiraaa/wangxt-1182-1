import { Router } from 'express';
import Joi from 'joi';
import { Document } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { DocumentType, DocumentStatus, UserRole } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const createDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .required()
    .messages({
      'any.required': '单证类型不能为空',
      'any.only': '单证类型不合法',
    }),
  documentNo: Joi.string().required().messages({
    'any.required': '单证编号不能为空',
  }),
  sampleBoxId: Joi.string().allow('', null),
  title: Joi.string().required().messages({
    'any.required': '单证标题不能为空',
  }),
  issueDate: Joi.date().allow(null),
  validFrom: Joi.date().allow(null),
  validUntil: Joi.date().allow(null),
  issuingAuthority: Joi.string().allow('', null),
  fileUrl: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const verifyDocumentSchema = Joi.object({
  verified: Joi.boolean().required().messages({
    'any.required': '核验状态不能为空',
  }),
  remarks: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      keyword: Joi.string().allow('', null),
      documentType: Joi.string().allow('', null),
      status: Joi.string().allow('', null),
      sampleBoxId: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { keyword, documentType, status, sampleBoxId } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (documentType) {
        where.documentType = documentType;
      }
      if (status) {
        where.status = status;
      }
      if (sampleBoxId) {
        where.sampleBoxId = sampleBoxId;
      }
      if (keyword) {
        where[Op.or] = [
          { documentNo: { [Op.iLike]: `%${keyword}%` } },
          { title: { [Op.iLike]: `%${keyword}%` } },
          { issuingAuthority: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await Document.findAndCountAll({
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
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return errorResponse(res, '单证不存在', 404);
    }

    return successResponse(res, document, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(createDocumentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;

      const document = await Document.create({
        ...req.body,
        createdById: user.id,
        createdByName: user.name,
        status: DocumentStatus.DRAFT,
      });

      if (
        req.body.documentType === DocumentType.ETHICS_APPROVAL &&
        req.body.sampleBoxId
      ) {
        const { SampleBox } = await import('../models');
        await SampleBox.update(
          {
            ethicsApprovalNo: req.body.documentNo,
            ethicsApprovalValidUntil: req.body.validUntil,
            ethicsApprovalFile: req.body.fileUrl,
          },
          { where: { id: req.body.sampleBoxId } }
        );
      }

      return successResponse(res, document, '单证创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(createDocumentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return errorResponse(res, '单证不存在', 404);
      }

      if (document.status === DocumentStatus.VERIFIED) {
        return errorResponse(res, '已核验的单证不能修改', 400);
      }

      await document.update(req.body);

      return successResponse(res, document, '单证更新成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/verify',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(verifyDocumentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return errorResponse(res, '单证不存在', 404);
      }

      const { verified } = req.body;

      await document.update({
        status: verified ? DocumentStatus.VERIFIED : DocumentStatus.SUBMITTED,
        verifiedById: verified ? user.id : null as any,
        verifiedByName: verified ? user.name : null as any,
        verifiedAt: verified ? new Date() : null as any,
      });

      if (document.documentType === DocumentType.ETHICS_APPROVAL && document.sampleBoxId) {
        const { SampleBox } = await import('../models');
        if (verified) {
          await SampleBox.update(
            { ethicsApprovalVerified: true },
            { where: { id: document.sampleBoxId } }
          );
        }
      }

      return successResponse(res, document, verified ? '单证核验通过' : '单证已提交');
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.CUSTOMS_OFFICER, UserRole.RESEARCH_CENTER),
  async (req: AuthRequest, res, next) => {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return errorResponse(res, '单证不存在', 404);
      }

      if (document.status === DocumentStatus.VERIFIED) {
        return errorResponse(res, '已核验的单证不能删除', 400);
      }

      await document.destroy();

      return successResponse(res, null, '单证删除成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
