import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface FlightChangeRecordAttributes {
  id: string;
  flightId: string;
  oldFlightNo: string;
  newFlightNo: string;
  oldAirline?: string;
  newAirline?: string;
  oldDeparture?: string;
  newDeparture?: string;
  oldDestination?: string;
  newDestination?: string;
  oldScheduledDepartureTime: Date;
  newScheduledDepartureTime: Date;
  oldScheduledArrivalTime: Date;
  newScheduledArrivalTime: Date;
  changeType: string;
  changeReason: string;
  affectedSampleBoxCount: number;
  operatorId: string;
  operatorName: string;
  operatedAt: Date;
  notifiedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightChangeRecordCreationAttributes
  extends Optional<FlightChangeRecordAttributes, 'id' | 'createdAt' | 'updatedAt' | 'operatedAt'> {}

export class FlightChangeRecord extends Model<FlightChangeRecordAttributes, FlightChangeRecordCreationAttributes> implements FlightChangeRecordAttributes {
  public id!: string;
  public flightId!: string;
  public oldFlightNo!: string;
  public newFlightNo!: string;
  public oldAirline?: string;
  public newAirline?: string;
  public oldDeparture?: string;
  public newDeparture?: string;
  public oldDestination?: string;
  public newDestination?: string;
  public oldScheduledDepartureTime!: Date;
  public newScheduledDepartureTime!: Date;
  public oldScheduledArrivalTime!: Date;
  public newScheduledArrivalTime!: Date;
  public changeType!: string;
  public changeReason!: string;
  public affectedSampleBoxCount!: number;
  public operatorId!: string;
  public operatorName!: string;
  public operatedAt!: Date;
  public notifiedAt?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FlightChangeRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    flightId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '原航班ID',
      references: {
        model: 'flights',
        key: 'id',
      },
    },
    oldFlightNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '原航班号',
    },
    newFlightNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '新航班号',
    },
    oldAirline: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '原航空公司',
    },
    newAirline: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '新航空公司',
    },
    oldDeparture: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '原出发地',
    },
    newDeparture: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '新出发地',
    },
    oldDestination: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '原目的地',
    },
    newDestination: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '新目的地',
    },
    oldScheduledDepartureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '原计划起飞时间',
    },
    newScheduledDepartureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '新计划起飞时间',
    },
    oldScheduledArrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '原计划到达时间',
    },
    newScheduledArrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '新计划到达时间',
    },
    changeType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'reschedule',
      comment: '变更类型: reschedule(改签), reroute(改航线), cancel(取消)',
    },
    changeReason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '变更原因',
    },
    affectedSampleBoxCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '受影响的样本盒数量',
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作人姓名',
    },
    operatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '操作时间',
    },
    notifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '通知时间',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'flight_change_records',
    indexes: [
      { fields: ['flight_id'] },
      { fields: ['old_flight_no'] },
      { fields: ['new_flight_no'] },
      { fields: ['operated_at'] },
    ],
  }
);
