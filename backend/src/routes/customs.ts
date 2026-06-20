import { Router } from 'express';
import Joi from 'joi';
import {
  SampleBox,
  Document,
  TemperatureRecord,
  FreezeRecord,
  FlowLog,
  Flight,
  SampleTube,
} from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { successResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import {
  UserRole,
  SampleBoxStatus,
  DocumentStatus,
  DocumentType,
  SAMPLE_FLOW_NODES,
} from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const REQUIRED_DOCS_FOR_EXPORT = [
  DocumentType.ETHICS_APPROVAL,
  DocumentType.CUSTOMS_DECLARATION,
  DocumentType.BIOLOGICAL_SAMPLE_PERMIT,
  DocumentType.SHIPPING_INVOICE,
  DocumentType.PACKING_LIST,
];

const DocumentTypeLabels: Record<string, string> = {
  [DocumentType.ETHICS_APPROVAL]: '伦理批件',
  [DocumentType.CUSTOMS_DECLARATION]: '报关单',
  [DocumentType.BIOLOGICAL_SAMPLE_PERMIT]: '生物样本许可',
  [DocumentType.SHIPPING_INVOICE]: '运输发票',
  [DocumentType.PACKING_LIST]: '装箱单',
  [DocumentType.HEALTH_CERTIFICATE]: '卫生证书',
};

router.get(
  '/tracking-summary',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateQuery(
    Joi.object({
      keyword: Joi.string().allow('', null),
      status: Joi.string().allow('', null),
      hasDocGap: Joi.boolean().allow(null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { keyword, status, hasDocGap } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};
      if (status) where.status = status;
      if (keyword) {
        where[Op.or] = [
          { boxCode: { [Op.iLike]: `%${keyword}%` } },
          { subjectCode: { [Op.iLike]: `%${keyword}%` } },
          { studyNo: { [Op.iLike]: `%${keyword}%` } },
          { researchCenterName: { [Op.iLike]: `%${keyword}%` } },
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
            attributes: ['id', 'documentType', 'documentNo', 'status', 'title', 'verifiedAt'],
          },
          {
            model: FlowLog,
            as: 'flowLogs',
            order: [['operatedAt', 'DESC']],
            limit: 5,
          },
        ],
      });

      const currentTime = new Date();
      const enrichedBoxes = rows.map((box) => {
        const boxJson = box.toJSON();
        const docs = boxJson.documents || [];

        const currentNode = SAMPLE_FLOW_NODES.find(
          (n) => n.key === boxJson.status
        );
        const currentNodeIndex = SAMPLE_FLOW_NODES.findIndex(
          (n) => n.key === boxJson.status
        );

        const docGaps: any[] = [];
        const isPastApproved = currentNodeIndex >= SAMPLE_FLOW_NODES.findIndex(
          (n) => n.key === SampleBoxStatus.EXPORT_APPROVED
        );

        if (currentNodeIndex >= 1) {
          for (const docType of REQUIRED_DOCS_FOR_EXPORT) {
            const matched = docs.find(
              (d: any) => d.documentType === docType && d.status === DocumentStatus.VERIFIED
            );
            const allMatched = docs.filter((d: any) => d.documentType === docType);
            if (!matched) {
              docGaps.push({
                documentType: docType,
                documentTypeLabel: DocumentTypeLabels[docType] || docType,
                currentStatus: allMatched.length > 0 ? allMatched[0].status : 'missing',
                currentStatusLabel: allMatched.length > 0
                  ? allMatched[0].status === DocumentStatus.DRAFT ? '草稿'
                    : allMatched[0].status === DocumentStatus.SUBMITTED ? '待核验'
                    : allMatched[0].status === DocumentStatus.EXPIRED ? '已过期'
                    : '未提交'
                  : '缺失',
              });
            } else if (matched && matched.verifiedAt && new Date(matched.verifiedAt) > currentTime) {
              docGaps.push({
                documentType: docType,
                documentTypeLabel: DocumentTypeLabels[docType] || docType,
                currentStatus: 'warning',
                currentStatusLabel: '即将过期',
              });
            }
          }
        }

        const ethicsLinkedDocs = docs.filter(
          (d: any) => d.documentType === DocumentType.ETHICS_APPROVAL
        );

        return {
          ...boxJson,
          currentNode: {
            key: currentNode?.key,
            label: currentNode?.label,
            role: currentNode?.role,
            index: currentNodeIndex,
          },
          flowNodes: SAMPLE_FLOW_NODES,
          documentGaps: docGaps,
          hasDocumentGap: docGaps.length > 0,
          ethicsLinked: ethicsLinkedDocs.length > 0 && ethicsLinkedDocs[0].status === DocumentStatus.VERIFIED,
          ethicsApprovalNo: boxJson.ethicsApprovalNo,
        };
      });

      const filteredBoxes = hasDocGap === true
        ? enrichedBoxes.filter((b) => b.hasDocumentGap)
        : hasDocGap === false
        ? enrichedBoxes.filter((b) => !b.hasDocumentGap)
        : enrichedBoxes;

      const totalGaps = enrichedBoxes.filter((b) => b.hasDocumentGap).length;
      const inTransit = enrichedBoxes.filter(
        (b) => [SampleBoxStatus.EXPORTED, SampleBoxStatus.IN_TRANSIT].includes(b.status as SampleBoxStatus)
      ).length;
      const frozen = enrichedBoxes.filter(
        (b) => b.status === SampleBoxStatus.FROZEN
      ).length;

      return successResponse(
        res,
        {
          sampleBoxes: filteredBoxes,
          stats: {
            total: count,
            totalWithDocGap: totalGaps,
            inTransit,
            frozen,
            page,
            pageSize,
          },
        },
        '报关视角节点追踪与单证缺口查询成功'
      );
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/box-detail/:boxId',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const { boxId } = req.params;

      const sampleBox = await SampleBox.findByPk(boxId, {
        include: [
          {
            model: Document,
            as: 'documents',
            order: [['createdAt', 'DESC']],
          },
          {
            model: FlowLog,
            as: 'flowLogs',
            order: [['operatedAt', 'ASC']],
          },
          {
            model: TemperatureRecord,
            as: 'temperatureRecords',
            order: [['recordedAt', 'DESC']],
            limit: 10,
          },
          {
            model: FreezeRecord,
            as: 'freezeRecords',
            order: [['initiatedAt', 'DESC']],
          },
          {
            model: SampleTube,
            as: 'sampleTubes',
            order: [['seqNo', 'ASC']],
            attributes: [
              'id', 'tubeCode', 'subjectCode', 'sampleType', 'seqNo',
              'ethicsApprovalNo', 'ethicsApprovalVerified', 'originalSampleBoxId',
            ],
          },
        ],
      });

      if (!sampleBox) {
        return successResponse(res, null, '样本盒不存在');
      }

      const boxJson = sampleBox.toJSON();

      const relatedFlight = await Flight.findOne({
        where: {
          sampleBoxIds: {
            [Op.contains]: [boxId],
          },
        },
        order: [['scheduledDepartureTime', 'DESC']],
      });

      const currentNodeIndex = SAMPLE_FLOW_NODES.findIndex(
        (n) => n.key === boxJson.status
      );
      const currentNode = SAMPLE_FLOW_NODES[currentNodeIndex];

      const docGaps: any[] = [];
      for (const docType of REQUIRED_DOCS_FOR_EXPORT) {
        const matched = boxJson.documents.find(
          (d: any) => d.documentType === docType && d.status === DocumentStatus.VERIFIED
        );
        const allDocs = boxJson.documents.filter((d: any) => d.documentType === docType);
        if (!matched) {
          docGaps.push({
            documentType: docType,
            label: DocumentTypeLabels[docType] || docType,
            hasDoc: allDocs.length > 0,
            verified: false,
          });
        }
      }

      return successResponse(
        res,
        {
          ...boxJson,
          relatedFlight,
          currentNode: currentNode
            ? { ...currentNode, index: currentNodeIndex }
            : null,
          flowNodes: SAMPLE_FLOW_NODES,
          documentGaps: docGaps,
          nextRequiredNode: currentNodeIndex < SAMPLE_FLOW_NODES.length - 1
            ? SAMPLE_FLOW_NODES[currentNodeIndex + 1]
            : null,
        },
        '报关视角样本盒详情查询成功'
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
