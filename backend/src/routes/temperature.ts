import { Router } from 'express';
import Joi from 'joi';
import { TemperatureRecord, SampleBox, FreezeRecord, FlowLog } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { UserRole, SampleBoxStatus, FreezeReason } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const createTemperatureRecordSchema = Joi.object({
  sampleBoxId: Joi.string().required().messages({
    'any.required': '样本盒ID不能为空',
  }),
  temperature: Joi.number().required().messages({
    'any.required': '温度值不能为空',
  }),
  recordedAt: Joi.date().allow(null),
  source: Joi.string().valid('manual', 'logistics_device', 'iot_sensor').default('manual'),
  location: Joi.string().allow('', null),
  isExceeded: Joi.boolean().allow(null),
  exceededReason: Joi.string().allow('', null),
  handlingAction: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      sampleBoxId: Joi.string().allow('', null),
      isExceeded: Joi.boolean().allow(null),
      startDate: Joi.date().allow(null),
      endDate: Joi.date().allow(null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { sampleBoxId, isExceeded, startDate, endDate } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (sampleBoxId) {
        where.sampleBoxId = sampleBoxId;
      }
      if (isExceeded !== undefined && isExceeded !== null) {
        where.isExceeded = isExceeded;
      }
      if (startDate || endDate) {
        where.recordedAt = {};
        if (startDate) {
          where.recordedAt[Op.gte] = new Date(startDate as string);
        }
        if (endDate) {
          where.recordedAt[Op.lte] = new Date(endDate as string);
        }
      }

      const { count, rows } = await TemperatureRecord.findAndCountAll({
        where,
        offset,
        limit,
        order: [['recordedAt', 'DESC']],
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
    const record = await TemperatureRecord.findByPk(req.params.id);

    if (!record) {
      return errorResponse(res, '温度记录不存在', 404);
    }

    return successResponse(res, record, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.CENTRAL_LAB, UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(createTemperatureRecordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { sampleBoxId, temperature, isExceeded } = req.body;

      const sampleBox = await SampleBox.findByPk(sampleBoxId);
      if (!sampleBox) {
        return errorResponse(res, '样本盒不存在', 404);
      }

      let actualIsExceeded = isExceeded;
      if (actualIsExceeded === undefined || actualIsExceeded === null) {
        const minTemp = Number(sampleBox.minTemp);
        const maxTemp = Number(sampleBox.maxTemp);
        const temp = Number(temperature);

        if (
          (!isNaN(minTemp) && temp < minTemp) ||
          (!isNaN(maxTemp) && temp > maxTemp)
        ) {
          actualIsExceeded = true;
        } else {
          actualIsExceeded = false;
        }
      }

      const record = await TemperatureRecord.create({
        ...req.body,
        isExceeded: actualIsExceeded,
        recordedBy: user.id,
        recordedByName: user.name,
        recordedAt: req.body.recordedAt || new Date(),
        handlerId: req.body.handlingAction ? user.id : null,
        handlerName: req.body.handlingAction ? user.name : null,
        handledAt: req.body.handlingAction ? new Date() : null,
      });

      await sampleBox.update({
        currentTemp: temperature,
        lastTempRecordAt: record.recordedAt,
      });

      if (actualIsExceeded && sampleBox.status !== SampleBoxStatus.FROZEN) {
        const freezeRecord = await FreezeRecord.create({
          sampleBoxId,
          freezeReason: FreezeReason.TEMP_EXCEEDED,
          freezeReasonDetail: req.body.exceededReason || `温度超限：当前${temperature}°C，限制范围${sampleBox.minTemp || '-'} ~ ${sampleBox.maxTemp || '-'}°C`,
          triggeredByTemperatureRecordId: record.id,
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
          operationType: 'temp_exceed_freeze',
          description: `温度超限自动冻结：${temperature}°C超出限制范围`,
        });
      }

      return successResponse(res, record, '温度记录创建成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
