import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface TemperatureRecordAttributes {
  id: string;
  sampleBoxId: string;
  temperature: number;
  recordedAt: Date;
  recordedBy?: string;
  recordedByName?: string;
  source: string;
  location?: string;
  isExceeded: boolean;
  exceededReason?: string;
  handlerId?: string;
  handlerName?: string;
  handledAt?: Date;
  handlingAction?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemperatureRecordCreationAttributes
  extends Optional<TemperatureRecordAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isExceeded' | 'recordedAt'> {}

export class TemperatureRecord extends Model<TemperatureRecordAttributes, TemperatureRecordCreationAttributes>
  implements TemperatureRecordAttributes {
  public id!: string;
  public sampleBoxId!: string;
  public temperature!: number;
  public recordedAt!: Date;
  public recordedBy?: string;
  public recordedByName?: string;
  public source!: string;
  public location?: string;
  public isExceeded!: boolean;
  public exceededReason?: string;
  public handlerId?: string;
  public handlerName?: string;
  public handledAt?: Date;
  public handlingAction?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TemperatureRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    sampleBoxId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '样本盒ID',
      references: {
        model: 'sample_boxes',
        key: 'id',
      },
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: '温度值(摄氏度)',
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '记录时间',
    },
    recordedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '记录人ID',
    },
    recordedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '记录人姓名',
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '数据来源: manual/logistics_device/iot_sensor',
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '温度记录地点',
    },
    isExceeded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否温度超限',
    },
    exceededReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '超限原因',
    },
    handlerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '处理人ID',
    },
    handlerName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '处理人姓名',
    },
    handledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处理时间',
    },
    handlingAction: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '处理措施',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'temperature_records',
    indexes: [
      { fields: ['sample_box_id'] },
      { fields: ['recorded_at'] },
      { fields: ['is_exceeded'] },
    ],
  }
);
