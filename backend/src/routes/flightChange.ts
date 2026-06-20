import { Router } from 'express';
import Joi from 'joi';
import { Flight, FlightChangeRecord, SampleBox } from '../models';
import { AuthRequest, authMiddleware, requireRoles } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { UserRole } from '../types/enums';
import { Op } from 'sequelize';

const router = Router();

const rescheduleFlightSchema = Joi.object({
  newFlightNo: Joi.string().required().messages({
    'any.required': '新航班号不能为空',
  }),
  newAirline: Joi.string().allow('', null),
  newDeparture: Joi.string().allow('', null),
  newDestination: Joi.string().allow('', null),
  newScheduledDepartureTime: Joi.date().required().messages({
    'any.required': '新计划起飞时间不能为空',
  }),
  newScheduledArrivalTime: Joi.date().required().messages({
    'any.required': '新计划到达时间不能为空',
  }),
  changeType: Joi.string().valid('reschedule', 'reroute', 'cancel').default('reschedule'),
  changeReason: Joi.string().required().messages({
    'any.required': '变更原因不能为空',
  }),
  remarks: Joi.string().allow('', null),
});

router.get(
  '/',
  authMiddleware,
  validateQuery(
    Joi.object({
      flightId: Joi.string().allow('', null),
      oldFlightNo: Joi.string().allow('', null),
      newFlightNo: Joi.string().allow('', null),
      keyword: Joi.string().allow('', null),
      page: Joi.number().integer().min(1),
      pageSize: Joi.number().integer().min(1).max(100),
    })
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const { flightId, oldFlightNo, newFlightNo, keyword } = req.query;
      const { page, pageSize, offset, limit } = getPaginationParams(req.query);

      const where: any = {};
      if (flightId) where.flightId = flightId;
      if (oldFlightNo) where.oldFlightNo = { [Op.iLike]: `%${oldFlightNo}%` };
      if (newFlightNo) where.newFlightNo = { [Op.iLike]: `%${newFlightNo}%` };
      if (keyword) {
        where[Op.or] = [
          { oldFlightNo: { [Op.iLike]: `%${keyword}%` } },
          { newFlightNo: { [Op.iLike]: `%${keyword}%` } },
          { changeReason: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await FlightChangeRecord.findAndCountAll({
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
    const record = await FlightChangeRecord.findByPk(req.params.id);

    if (!record) {
      return errorResponse(res, '改签记录不存在', 404);
    }

    return successResponse(res, record, '查询成功');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:flightId/reschedule',
  authMiddleware,
  requireRoles(UserRole.CUSTOMS_OFFICER, UserRole.ADMIN),
  validateBody(rescheduleFlightSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { flightId } = req.params;
      const {
        newFlightNo,
        newAirline,
        newDeparture,
        newDestination,
        newScheduledDepartureTime,
        newScheduledArrivalTime,
        changeType,
        changeReason,
        remarks,
      } = req.body;

      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        return errorResponse(res, '航班不存在', 404);
      }

      if (['departed', 'in_flight', 'landed', 'arrived'].includes(flight.status)) {
        return errorResponse(res, '航班已起飞或已到达，不能改签', 400);
      }

      const affectedBoxes = flight.sampleBoxIds?.length
        ? await SampleBox.findAll({
            where: { id: { [Op.in]: flight.sampleBoxIds } },
            attributes: ['id', 'boxCode', 'subjectCode', 'status'],
          })
        : [];

      const changeRecord = await FlightChangeRecord.create({
        flightId,
        oldFlightNo: flight.flightNo,
        newFlightNo,
        oldAirline: flight.airline,
        newAirline: newAirline || flight.airline,
        oldDeparture: flight.departure,
        newDeparture: newDeparture || flight.departure,
        oldDestination: flight.destination,
        newDestination: newDestination || flight.destination,
        oldScheduledDepartureTime: flight.scheduledDepartureTime,
        newScheduledDepartureTime,
        oldScheduledArrivalTime: flight.scheduledArrivalTime,
        newScheduledArrivalTime,
        changeType,
        changeReason,
        affectedSampleBoxCount: affectedBoxes.length,
        operatorId: user.id,
        operatorName: user.name,
        remarks,
      });

      await flight.update({
        flightNo: newFlightNo,
        airline: newAirline || flight.airline,
        departure: newDeparture || flight.departure,
        destination: newDestination || flight.destination,
        scheduledDepartureTime: newScheduledDepartureTime,
        scheduledArrivalTime: newScheduledArrivalTime,
        status: changeType === 'cancel' ? 'cancelled' : 'scheduled',
        isDelayed: false,
        delayMinutes: null,
        delayReason: null,
      });

      return successResponse(
        res,
        {
          changeRecord,
          affectedBoxes,
        },
        '航班改签成功'
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
