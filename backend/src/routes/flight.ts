import { Router } from 'express';
import Joi from 'joi';
import { Flight, SampleBox, FreezeRecord, FlowLog, FlightChangeRecord } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { UserRole, SampleBoxStatus, FreezeReason } from '../types/enums';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const router = Router();

const createFlightSchema = Joi.object({
  flightNo: Joi.string().required().messages({
    'any.required': '航班号不能为空',
  }),
  airline: Joi.string().required().messages({
    'any.required': '航空公司不能为空',
  }),
  departure: Joi.string().required().messages({
    'any.required': '出发地不能为空',
  }),
  destination: Joi.string().required().messages({
    'any.required': '目的地不能为空',
  }),
  scheduledDepartureTime: Joi.date().required().messages({
    'any.required': '计划起飞时间不能为空',
  }),
  scheduledArrivalTime: Joi.date().required().messages({
    'any.required': '计划到达时间不能为空',
  }),
  sampleBoxIds: Joi.array().items(Joi.string()).allow(null),
  status: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

const updateFlightStatusSchema = Joi.object({
  status: Joi.string().required().messages({
    'any.required': '航班状态不能为空',
  }),
  actualDepartureTime: Joi.date().allow(null),
  actualArrivalTime: Joi.date().allow(null),
  isDelayed: Joi.boolean().allow(null),
  delayMinutes: Joi.number().allow(null),
  delayReason: Joi.string().allow('', null),
  remarks: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      keyword: Joi.string().allow('', null),
      status: Joi.string().allow('', null),
      date: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { keyword, status, date } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};

      if (status) {
        where.status = status;
      }
      if (date) {
        where.scheduledDepartureTime = {
          [Op.between]: [
            dayjs(date as string).startOf('day').toDate(),
            dayjs(date as string).endOf('day').toDate(),
          ],
        };
      }
      if (keyword) {
        where[Op.or] = [
          { flightNo: { [Op.iLike]: `%${keyword}%` } },
          { airline: { [Op.iLike]: `%${keyword}%` } },
          { departure: { [Op.iLike]: `%${keyword}%` } },
          { destination: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await Flight.findAndCountAll({
        where,
        offset,
        limit,
        order: [['scheduledDepartureTime', 'DESC']],
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
    const flight = await Flight.findByPk(req.params.id);

    if (!flight) {
      return errorResponse(res, '航班不存在', 404);
    }

    const sampleBoxes = flight.sampleBoxIds?.length
      ? await SampleBox.findAll({
          where: { id: { [Op.in]: flight.sampleBoxIds } },
          attributes: ['id', 'boxCode', 'subjectCode', 'status'],
        })
      : [];

    const changeRecords = await FlightChangeRecord.findAll({
      where: { flightId: flight.id },
      order: [['operatedAt', 'DESC']],
    });

    return successResponse(
      res,
      {
        ...flight.toJSON(),
        sampleBoxes,
        changeRecords,
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
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(createFlightSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;

      const flight = await Flight.create({
        ...req.body,
        customsOfficerId: user.id,
        customsOfficerName: user.name,
        isDelayed: false,
      });

      return successResponse(res, flight, '航班创建成功');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/status',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(updateFlightStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const flight = await Flight.findByPk(req.params.id);

      if (!flight) {
        return errorResponse(res, '航班不存在', 404);
      }

      const oldStatus = flight.status;
      await flight.update(req.body);

      if (req.body.isDelayed && req.body.delayMinutes && req.body.delayMinutes > 120) {
        const affectedBoxes = flight.sampleBoxIds?.length
          ? await SampleBox.findAll({
              where: {
                id: { [Op.in]: flight.sampleBoxIds },
                status: [SampleBoxStatus.IN_TRANSIT, SampleBoxStatus.EXPORTED],
              },
            })
          : [];

        for (const box of affectedBoxes) {
          const freezeRecord = await FreezeRecord.create({
            sampleBoxId: box.id,
            freezeReason: FreezeReason.FLIGHT_DELAY,
            freezeReasonDetail: `航班${flight.flightNo}延误${req.body.delayMinutes}分钟，超过2小时`,
            triggeredByFlightId: flight.id,
            initiatedById: user.id,
            initiatedByName: user.name,
          });

          await box.update({ status: SampleBoxStatus.FROZEN });

          await FlowLog.create({
            sampleBoxId: box.id,
            fromStatus: box.status as SampleBoxStatus,
            toStatus: SampleBoxStatus.FROZEN,
            operatorId: user.id,
            operatorName: user.name,
            operatorRole: user.role as UserRole,
            operationType: 'auto_freeze',
            description: `航班延误自动冻结：${flight.flightNo}延误${req.body.delayMinutes}分钟`,
          });
        }

        if (affectedBoxes.length > 0) {
          console.log(`航班延误自动冻结了 ${affectedBoxes.length} 个样本盒`);
        }
      }

      return successResponse(res, flight, '航班状态更新成功');
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/assign-boxes',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(
    Joi.object({
      sampleBoxIds: Joi.array().items(Joi.string()).required().messages({
        'any.required': '样本盒ID列表不能为空',
      }),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const flight = await Flight.findByPk(req.params.id);

      if (!flight) {
        return errorResponse(res, '航班不存在', 404);
      }

      const { sampleBoxIds } = req.body;
      const existingIds = flight.sampleBoxIds || [];
      const newIds = [...new Set([...existingIds, ...sampleBoxIds])];

      await flight.update({ sampleBoxIds: newIds });

      return successResponse(res, flight, '样本盒关联成功');
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const flight = await Flight.findByPk(req.params.id);

      if (!flight) {
        return errorResponse(res, '航班不存在', 404);
      }

      if (['departed', 'in_flight', 'landed', 'arrived'].includes(flight.status)) {
        return errorResponse(res, '已起飞的航班不能删除', 400);
      }

      await flight.destroy();

      return successResponse(res, null, '航班删除成功');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
