import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { BoxSplitStatus } from '../types/enums';

export interface BoxSplitRecordAttributes {
  id: string;
  sourceBoxId: string;
  sourceBoxCode: string;
  targetBoxIds: string[];
  splitType: string;
  splitReason?: string;
  status: BoxSplitStatus;
  operatorId: string;
  operatorName: string;
  operatedAt: Date;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoxSplitRecordCreationAttributes
  extends Optional<BoxSplitRecordAttributes, 'id' | 'createdAt' | 'updatedAt' | 'operatedAt' | 'status'> {}

export class BoxSplitRecord extends Model<BoxSplitRecordAttributes, BoxSplitRecordCreationAttributes> implements BoxSplitRecordAttributes {
  public id!: string;
  public sourceBoxId!: string;
  public sourceBoxCode!: string;
  public targetBoxIds!: string[];
  public splitType!: string;
  public splitReason?: string;
  public status!: BoxSplitStatus;
  public operatorId!: string;
  public operatorName!: string;
  public operatedAt!: Date;
  public approvedById?: string;
  public approvedByName?: string;
  public approvedAt?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BoxSplitRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    sourceBoxId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '源样本盒ID（母盒）',
      references: {
        model: 'sample_boxes',
        key: 'id',
      },
    },
    sourceBoxCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '源样本盒编码',
    },
    targetBoxIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      comment: '目标样本盒ID列表（子盒）',
    },
    splitType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'by_count',
      comment: '分箱方式: by_count(按数量), by_type(按类型), manual(手动)',
    },
    splitReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分箱原因',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BoxSplitStatus)),
      allowNull: false,
      defaultValue: BoxSplitStatus.COMPLETED,
      comment: '分箱状态',
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
    approvedById: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '审批人ID',
    },
    approvedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '审批人姓名',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审批时间',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'box_split_records',
    indexes: [
      { fields: ['source_box_id'] },
      { fields: ['status'] },
      { fields: ['operated_at'] },
    ],
  }
);
