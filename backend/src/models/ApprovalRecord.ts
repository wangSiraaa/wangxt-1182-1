import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { ApprovalType, ApprovalStatus, SampleBoxStatus } from '../types/enums';

export interface ApprovalRecordAttributes {
  id: string;
  approvalType: ApprovalType;
  businessId: string;
  businessType: string;
  title: string;
  currentStatus: SampleBoxStatus;
  targetStatus: SampleBoxStatus;
  initiatorId: string;
  initiatorName: string;
  initiatedAt: Date;
  approvalStatus: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRecordCreationAttributes
  extends Optional<ApprovalRecordAttributes, 'id' | 'createdAt' | 'updatedAt' | 'initiatedAt' | 'approvalStatus'> {}

export class ApprovalRecord extends Model<ApprovalRecordAttributes, ApprovalRecordCreationAttributes>
  implements ApprovalRecordAttributes {
  public id!: string;
  public approvalType!: ApprovalType;
  public businessId!: string;
  public businessType!: string;
  public title!: string;
  public currentStatus!: SampleBoxStatus;
  public targetStatus!: SampleBoxStatus;
  public initiatorId!: string;
  public initiatorName!: string;
  public initiatedAt!: Date;
  public approvalStatus!: ApprovalStatus;
  public approverId?: string;
  public approverName?: string;
  public approvedAt?: Date;
  public rejectionReason?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ApprovalRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    approvalType: {
      type: DataTypes.ENUM(...Object.values(ApprovalType)),
      allowNull: false,
      comment: '审批类型',
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '业务单据ID',
    },
    businessType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '业务单据类型',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '审批标题',
    },
    currentStatus: {
      type: DataTypes.ENUM(...Object.values(SampleBoxStatus)),
      allowNull: true,
      comment: '当前状态',
    },
    targetStatus: {
      type: DataTypes.ENUM(...Object.values(SampleBoxStatus)),
      allowNull: true,
      comment: '目标状态',
    },
    initiatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '发起人ID',
    },
    initiatorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '发起人姓名',
    },
    initiatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '发起时间',
    },
    approvalStatus: {
      type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
      allowNull: false,
      defaultValue: ApprovalStatus.PENDING,
      comment: '审批状态',
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '审批人ID',
    },
    approverName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '审批人姓名',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审批时间',
    },
    rejectionReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '驳回原因',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'approval_records',
    indexes: [
      { fields: ['business_id', 'business_type'] },
      { fields: ['approval_status'] },
      { fields: ['approval_type'] },
      { fields: ['initiator_id'] },
    ],
  }
);
