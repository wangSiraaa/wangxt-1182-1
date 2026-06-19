import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { SampleBoxStatus, UserRole } from '../types/enums';

export interface FlowLogAttributes {
  id: string;
  sampleBoxId: string;
  fromStatus?: SampleBoxStatus;
  toStatus: SampleBoxStatus;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operatedAt: Date;
  operationType: string;
  description?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowLogCreationAttributes
  extends Optional<FlowLogAttributes, 'id' | 'createdAt' | 'updatedAt' | 'operatedAt'> {}

export class FlowLog extends Model<FlowLogAttributes, FlowLogCreationAttributes> implements FlowLogAttributes {
  public id!: string;
  public sampleBoxId!: string;
  public fromStatus?: SampleBoxStatus;
  public toStatus!: SampleBoxStatus;
  public operatorId!: string;
  public operatorName!: string;
  public operatorRole!: UserRole;
  public operatedAt!: Date;
  public operationType!: string;
  public description?: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FlowLog.init(
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
    fromStatus: {
      type: DataTypes.ENUM(...Object.values(SampleBoxStatus)),
      allowNull: true,
      comment: '流转前状态',
    },
    toStatus: {
      type: DataTypes.ENUM(...Object.values(SampleBoxStatus)),
      allowNull: false,
      comment: '流转后状态',
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
    operatorRole: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      comment: '操作人角色',
    },
    operatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '操作时间',
    },
    operationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '操作描述',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'flow_logs',
    indexes: [
      { fields: ['sample_box_id'] },
      { fields: ['to_status'] },
      { fields: ['operated_at'] },
    ],
  }
);
