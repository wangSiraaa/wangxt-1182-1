import { Router } from 'express';
import { SampleBox, FlowLog, Document, User } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { successResponse } from '../utils/response';
import { UserRole, SampleBoxStatus, DocumentType } from '../types/enums';
import { Op, literal } from 'sequelize';

const router = Router();

router.get(
  '/statistics',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;

      const where: any = {};
      if (user.role === UserRole.RESEARCH_CENTER) {
        where.researchCenterId = user.id;
      }
      if (user.role === UserRole.CUSTOMS_OFFICER) {
        where.customsOfficerId = user.id;
      }
      if (user.role === UserRole.CENTRAL_LAB) {
        where.centralLabId = user.id;
      }

      const allStatuses = Object.values(SampleBoxStatus);
      const statusCounts = await Promise.all(
        allStatuses.map(async (status) => {
          const count = await SampleBox.count({
            where: { ...where, status },
          });
          return { status, count };
        })
      );

      const total = await SampleBox.count({ where });
      const frozenCount = statusCounts.find(
        (s) => s.status === SampleBoxStatus.FROZEN
      )?.count || 0;
      const abnormalCount = statusCounts.find(
        (s) => s.status === SampleBoxStatus.TEMP_ABNORMAL
      )?.count || 0;

      const pendingExportCount = await SampleBox.count({
        where: {
          ...where,
          status: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
        },
      });

      const pendingEthicsCount = await SampleBox.count({
        where: {
          ...where,
          ethicsApprovalVerified: false,
          status: {
            [Op.in]: [SampleBoxStatus.DRAFT, SampleBoxStatus.REGISTERED],
          },
        },
      });

      return successResponse(res, {
        summary: {
          total,
          frozen: frozenCount,
          abnormal: abnormalCount,
          pendingExport: pendingExportCount,
          pendingEthics: pendingEthicsCount,
        },
        statusCounts,
      }, '统计数据获取成功');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/flow-nodes',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const nodeDefinitions = [
        {
          key: SampleBoxStatus.DRAFT,
          label: '草稿',
          role: UserRole.RESEARCH_CENTER,
          color: '#d9d9d9',
          order: 1,
        },
        {
          key: SampleBoxStatus.REGISTERED,
          label: '已登记',
          role: UserRole.RESEARCH_CENTER,
          color: '#1890ff',
          order: 2,
        },
        {
          key: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
          label: '待出境审批',
          role: UserRole.ADMIN,
          color: '#faad14',
          order: 3,
        },
        {
          key: SampleBoxStatus.EXPORT_APPROVED,
          label: '出境审批通过',
          role: UserRole.ADMIN,
          color: '#52c41a',
          order: 4,
        },
        {
          key: SampleBoxStatus.EXPORT_REJECTED,
          label: '出境申请驳回',
          role: UserRole.ADMIN,
          color: '#ff4d4f',
          order: 4,
        },
        {
          key: SampleBoxStatus.EXPORTED,
          label: '已出境',
          role: UserRole.CUSTOMS_OFFICER,
          color: '#722ed1',
          order: 5,
        },
        {
          key: SampleBoxStatus.IN_TRANSIT,
          label: '运输中',
          role: UserRole.CUSTOMS_OFFICER,
          color: '#13c2c2',
          order: 6,
        },
        {
          key: SampleBoxStatus.ARRIVED,
          label: '已到样待确认',
          role: UserRole.CENTRAL_LAB,
          color: '#1890ff',
          order: 7,
        },
        {
          key: SampleBoxStatus.TEMP_NORMAL,
          label: '温度正常',
          role: UserRole.CENTRAL_LAB,
          color: '#52c41a',
          order: 8,
        },
        {
          key: SampleBoxStatus.TEMP_ABNORMAL,
          label: '温度异常',
          role: UserRole.CENTRAL_LAB,
          color: '#faad14',
          order: 8,
        },
        {
          key: SampleBoxStatus.FROZEN,
          label: '已冻结',
          role: UserRole.CENTRAL_LAB,
          color: '#ff4d4f',
          order: 9,
        },
        {
          key: SampleBoxStatus.THAWED,
          label: '已解冻',
          role: UserRole.CENTRAL_LAB,
          color: '#52c41a',
          order: 10,
        },
        {
          key: SampleBoxStatus.DESTROYED,
          label: '已销毁',
          role: UserRole.CENTRAL_LAB,
          color: '#8c8c8c',
          order: 11,
        },
      ];

      return successResponse(res, nodeDefinitions, '流转节点定义获取成功');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/todos',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const todos: any[] = [];

      if (
        user.role === UserRole.RESEARCH_CENTER ||
        user.role === UserRole.ADMIN
      ) {
        const pendingEthics = await SampleBox.findAll({
          where: {
            researchCenterId:
              user.role === UserRole.RESEARCH_CENTER ? user.id : undefined,
            ethicsApprovalVerified: false,
            status: {
              [Op.in]: [SampleBoxStatus.DRAFT, SampleBoxStatus.REGISTERED],
            },
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'ethics',
          title: '伦理批件待完善/核验',
          count: pendingEthics.length,
          items: pendingEthics,
        });

        const draftBoxes = await SampleBox.findAll({
          where: {
            researchCenterId:
              user.role === UserRole.RESEARCH_CENTER ? user.id : undefined,
            status: SampleBoxStatus.DRAFT,
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'draft',
          title: '待登记的样本盒',
          count: draftBoxes.length,
          items: draftBoxes,
        });
      }

      if (user.role === UserRole.ADMIN) {
        const pendingApproval = await SampleBox.findAll({
          where: {
            status: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'approval',
          title: '待审批的出境申请',
          count: pendingApproval.length,
          items: pendingApproval,
        });
      }

      if (
        user.role === UserRole.CUSTOMS_OFFICER ||
        user.role === UserRole.ADMIN
      ) {
        const approvedBoxes = await SampleBox.findAll({
          where: {
            status: SampleBoxStatus.EXPORT_APPROVED,
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'export',
          title: '待出境的样本盒',
          count: approvedBoxes.length,
          items: approvedBoxes,
        });
      }

      if (user.role === UserRole.CENTRAL_LAB || user.role === UserRole.ADMIN) {
        const arrivedBoxes = await SampleBox.findAll({
          where: {
            status: SampleBoxStatus.ARRIVED,
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'arrival',
          title: '待确认到样的样本盒',
          count: arrivedBoxes.length,
          items: arrivedBoxes,
        });

        const tempPendingBoxes = await SampleBox.findAll({
          where: {
            status: {
              [Op.in]: [SampleBoxStatus.ARRIVED, SampleBoxStatus.TEMP_ABNORMAL],
            },
          },
          limit: 10,
          order: [['createdAt', 'DESC']],
        });

        todos.push({
          type: 'temperature',
          title: '待温度确认的样本盒',
          count: tempPendingBoxes.length,
          items: tempPendingBoxes,
        });
      }

      return successResponse(res, todos, '待办事项获取成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
