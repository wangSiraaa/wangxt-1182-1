import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface FlightAttributes {
  id: string;
  flightNo: string;
  airline: string;
  departure: string;
  destination: string;
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  isDelayed: boolean;
  delayMinutes?: number;
  delayReason?: string;
  sampleBoxIds?: string[];
  customsOfficerId?: string;
  customsOfficerName?: string;
  status: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightCreationAttributes
  extends Optional<FlightAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isDelayed' | 'status'> {}

export class Flight extends Model<FlightAttributes, FlightCreationAttributes> implements FlightAttributes {
  public id!: string;
  public flightNo!: string;
  public airline!: string;
  public departure!: string;
  public destination!: string;
  public scheduledDepartureTime!: Date;
  public scheduledArrivalTime!: Date;
  public actualDepartureTime?: Date;
  public actualArrivalTime?: Date;
  public isDelayed!: boolean;
  public delayMinutes?: number;
  public delayReason?: string;
  public sampleBoxIds?: string[];
  public customsOfficerId?: string;
  public customsOfficerName?: string;
  public status!: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Flight.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    flightNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '航班号',
    },
    airline: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '航空公司',
    },
    departure: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '出发地',
    },
    destination: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '目的地',
    },
    scheduledDepartureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '计划起飞时间',
    },
    scheduledArrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '计划到达时间',
    },
    actualDepartureTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际起飞时间',
    },
    actualArrivalTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际到达时间',
    },
    isDelayed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否延误',
    },
    delayMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '延误时长（分钟）',
    },
    delayReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '延误原因',
    },
    sampleBoxIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      comment: '关联样本盒ID列表',
    },
    customsOfficerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '报关专员ID',
    },
    customsOfficerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '报关专员姓名',
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'scheduled',
      comment: '航班状态: scheduled/boarding/departed/in_flight/landed/arrived/cancelled',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'flights',
    indexes: [
      { fields: ['flight_no'] },
      { fields: ['status'] },
      { fields: ['scheduled_departure_time'] },
    ],
  }
);
