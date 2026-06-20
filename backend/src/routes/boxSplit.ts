import { Router } from 'express';
import Joi from 'joi';
import {
  SampleBox,
  SampleTube,
  BoxSplitRecord,
  FlowLog,
  Document,
} from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { UserRole, SampleBoxStatus, BoxSplitStatus } from '../types/enums';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../database/connection';

const router = Router();

const splitBoxSchema = Joi.object({
  sourceBoxId: Joi.string().required().messages({
    'any.required': '源样本盒ID不能为空',
  }),
  splitReason: Joi.string().allow('', null),
  splitType: Joi.string().valid('by_count', 'by_type', 'manual').default('by_count'),
  targetBoxes: Joi.array()
    .items(
      Joi.object({
        boxCode: Joi.string().allow('', null),
        subjectCode: Joi.string().required(),
        sampleCount: Joi.number().integer().min(1).required(),
        tubeIds: Joi.array().items(Joi.string()).optional(),
        sampleType: Joi.string().allow('', null),
        studyNo: Joi.string().allow('', null),
      })
    )
    .min(2)
    .required()
    .messages({
      'any.required': '目标样本盒列表不能为空',
      'array.min': '至少需要分拆为2个目标盒',
    }),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      sourceBoxId: Joi.string().allow('', null),
      status: Joi.string().allow('', null),
      keyword: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sourceBoxId, status, keyword } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};
      if (sourceBoxId) where.sourceBoxId = sourceBoxId;
      if (status) where.status = status;
      if (keyword) {
        where[Op.or] = [
          { sourceBoxCode: { [Op.iLike]: `%${keyword}%` } },
          { splitReason: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await BoxSplitRecord.findAndCountAll({
        where,
        offset,
        limit,
        order: [['operatedAt', 'DESC']],
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
    const record = await BoxSplitRecord.findByPk(req.params.id, {
      include: [
        {
          model: SampleTube,
          as: 'tubes',
        },
      ],
    });

    if (!record) {
      return errorResponse(res, '分箱记录不存在', 404);
    }

    const sourceBox = await SampleBox.findByPk(record.sourceBoxId, {
      attributes: ['id', 'boxCode', 'subjectCode', 'status', 'ethicsApprovalNo'],
    });

    const targetBoxes = record.targetBoxIds?.length
      ? await SampleBox.findAll({
          where: { id: { [Op.in]: record.targetBoxIds } },
          include: [
            {
              model: SampleTube,
              as: 'sampleTubes',
              attributes: ['id', 'tubeCode', 'subjectCode', 'seqNo', 'sampleType'],
            },
          ],
          attributes: ['id', 'boxCode', 'subjectCode', 'sampleCount', 'ethicsApprovalNo'],
        })
      : [];

    return successResponse(
      res,
      {
        ...record.toJSON(),
        sourceBox,
        targetBoxes,
      },
      '查询成功'
    );
  } catch (error) {
    next(error);
  }
});

router.post(
  '/split',
  authMiddleware,
  requireRoles(UserRole.RESEARCH_CENTER, UserRole.ADMIN),
  validateBody(splitBoxSchema),
  async (req: AuthRequest, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const user = req.user!;
      const { sourceBoxId, targetBoxes, splitReason, splitType } = req.body;

      const sourceBox = await SampleBox.findByPk(sourceBoxId, { transaction });
      if (!sourceBox) {
        await transaction.rollback();
        return errorResponse(res, '源样本盒不存在', 404);
      }

      if (sourceBox.status !== SampleBoxStatus.DRAFT && sourceBox.status !== SampleBoxStatus.REGISTERED) {
        await transaction.rollback();
        return errorResponse(res, '只有草稿或已登记状态的样本盒可以分箱', 400);
      }

      const sourceTubes = await SampleTube.findAll({
        where: { sampleBoxId: sourceBoxId },
        order: [['seqNo', 'ASC']],
        transaction,
      });

      if (sourceTubes.length === 0) {
        await transaction.rollback();
        return errorResponse(res, '源样本盒中没有样本管，无法分箱', 400);
      }

      const totalTargetCount = targetBoxes.reduce(
        (sum: number, box: any) => sum + (box.sampleCount || 0),
        0
      );

      if (totalTargetCount !== sourceTubes.length) {
        await transaction.rollback();
        return errorResponse(
          res,
          `目标盒样本总数(${totalTargetCount})与源盒样本数(${sourceTubes.length})不一致`,
          400
        );
      }

      const createdBoxIds: string[] = [];
      const createdBoxCodes: string[] = [];
      let tubeCursor = 0;

      for (let i = 0; i < targetBoxes.length; i++) {
        const target = targetBoxes[i];
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const boxCode = target.boxCode || `SB${datePart}${randomPart}S${i + 1}`;

        const newBox = await SampleBox.create(
          {
            boxCode,
            subjectCode: target.subjectCode || sourceBox.subjectCode,
            studyNo: target.studyNo || sourceBox.studyNo,
            sampleType: target.sampleType || sourceBox.sampleType,
            storageCondition: sourceBox.storageCondition,
            minTemp: sourceBox.minTemp,
            maxTemp: sourceBox.maxTemp,
            sampleCount: target.sampleCount,
            researchCenterId: sourceBox.researchCenterId,
            researchCenterName: sourceBox.researchCenterName,
            ethicsApprovalNo: sourceBox.ethicsApprovalNo,
            ethicsApprovalValidUntil: sourceBox.ethicsApprovalValidUntil,
            ethicsApprovalFile: sourceBox.ethicsApprovalFile,
            ethicsApprovalVerified: sourceBox.ethicsApprovalVerified,
            status: SampleBoxStatus.DRAFT,
          },
          { transaction }
        );

        createdBoxIds.push(newBox.id);
        createdBoxCodes.push(boxCode);

        const tubesToAssign: SampleTube[] = [];
        if (splitType === 'manual' && target.tubeIds?.length) {
          const found = sourceTubes.filter((t) => target.tubeIds.includes(t.id));
          tubesToAssign.push(...found);
        } else {
          for (let j = 0; j < target.sampleCount; j++) {
            if (tubeCursor < sourceTubes.length) {
              tubesToAssign.push(sourceTubes[tubeCursor]);
              tubeCursor++;
            }
          }
        }

        for (let k = 0; k < tubesToAssign.length; k++) {
          const tube = tubesToAssign[k];
          await tube.update(
            {
              sampleBoxId: newBox.id,
              originalSampleBoxId: sourceBoxId,
              seqNo: k + 1,
              status: 'split',
            },
            { transaction }
          );
        }

        const srcDocs = await Document.findAll({
          where: { sampleBoxId: sourceBoxId },
          transaction,
        });

        for (const doc of srcDocs) {
          await Document.create(
            {
              documentType: doc.documentType,
              documentNo: `${doc.documentNo}-${i + 1}`,
              sampleBoxId: newBox.id,
              title: doc.title,
              issueDate: doc.issueDate,
              validFrom: doc.validFrom,
              validUntil: doc.validUntil,
              issuingAuthority: doc.issuingAuthority,
              fileUrl: doc.fileUrl,
              status: doc.status,
              createdById: user.id,
              createdByName: user.name,
              remarks: `由样本盒${sourceBox.boxCode}分箱生成`,
            },
            { transaction }
          );
        }
      }

      await sourceBox.update({ sampleCount: 0 }, { transaction });

      const splitRecord = await BoxSplitRecord.create(
        {
          sourceBoxId,
          sourceBoxCode: sourceBox.boxCode,
          targetBoxIds: createdBoxIds,
          splitType,
          splitReason,
          status: BoxSplitStatus.COMPLETED,
          operatorId: user.id,
          operatorName: user.name,
          remarks: `分箱为${targetBoxes.length}个子盒: ${createdBoxCodes.join(', ')}`,
        },
        { transaction }
      );

      await SampleTube.update(
        { boxSplitRecordId: splitRecord.id },
        {
          where: { sampleBoxId: { [Op.in]: createdBoxIds }, originalSampleBoxId: sourceBoxId },
          transaction,
        }
      );

      await FlowLog.create(
        {
          sampleBoxId: sourceBoxId,
          fromStatus: sourceBox.status as SampleBoxStatus,
          toStatus: SampleBoxStatus.DRAFT,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role as UserRole,
          operationType: 'split_box',
          description: `样本盒分箱：拆分为${targetBoxes.length}个子盒`,
          remark: splitReason,
        },
        { transaction }
      );

      await transaction.commit();

      return successResponse(
        res,
        {
          splitRecord,
          sourceBoxCode: sourceBox.boxCode,
          targetBoxIds: createdBoxIds,
          targetBoxCodes: createdBoxCodes,
        },
        '分箱成功'
      );
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
);

export default router;
