import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { FreezeReason, ApprovalStatus } from '../types/enums';

export interface FreezeRecordAttributes {
  id: string;
  sampleBoxId: string;
  freezeReason: FreezeReason;
  freezeReasonDetail?: string;
  triggeredByTemperatureRecordId?: string;
  triggeredByFlightId?: string;
  initiatedById: string;
  initiatedByName: string;
  initiatedAt: Date;
  approvalStatus: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  isThawed: boolean;
  thawedById?: string;
  thawedByName?: string;
  thawedAt?: Date;
  thawReason?: string;
  isDestroyed: boolean;
  destroyedById?: string;
  destroyedByName?: string;
  destroyedAt?: Date;
  destroyReason?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FreezeRecordCreationAttributes
  extends Optional<FreezeRecordAttributes, 'id' | 'createdAt' | 'updatedAt' | 'initiatedAt' | 'approvalStatus' | 'isThawed' | 'isDestroyed'> {}

export class FreezeRecord extends Model<FreezeRecordAttributes, FreezeRecordCreationAttributes>
  implements FreezeRecordAttributes {
  public id!: string;
  public sampleBoxId!: string;
  public freezeReason!: FreezeReason;
  public freezeReasonDetail?: string;
  public triggeredByTemperatureRecordId?: string;
  public triggeredByFlightId?: string;
  public initiatedById!: string;
  public initiatedByName!: string;
  public initiatedAt!: Date;
  public approvalStatus!: ApprovalStatus;
  public approverId?: string;
  public approverName?: string;
  public approvedAt?: Date;
  public rejectionReason?: string;
  public isThawed!: boolean;
  public thawedById?: string;
  public thawedByName?: string;
  public thawedAt?: Date;
  public thawReason?: string;
  public isDestroyed!: boolean;
  public destroyedById?: string;
  public destroyedByName?: string;
  public destroyedAt?: Date;
  public destroyReason?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FreezeRecord.init(
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
    freezeReason: {
      type: DataTypes.ENUM(...Object.values(FreezeReason)),
      allowNull: false,
      comment: '冻结原因',
    },
    freezeReasonDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '冻结原因详情',
    },
    triggeredByTemperatureRecordId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联温度记录ID',
    },
    triggeredByFlightId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联航班ID',
    },
    initiatedById: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '发起人ID',
    },
    initiatedByName: {
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
    isThawed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已解冻',
    },
    thawedById: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '解冻人ID',
    },
    thawedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '解冻人姓名',
    },
    thawedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '解冻时间',
    },
    thawReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '解冻原因',
    },
    isDestroyed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已销毁',
    },
    destroyedById: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '销毁人ID',
    },
    destroyedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '销毁人姓名',
    },
    destroyedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '销毁时间',
    },
    destroyReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '销毁原因',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'freeze_records',
    indexes: [
      { fields: ['sample_box_id'] },
      { fields: ['approval_status'] },
      { fields: ['freeze_reason'] },
    ],
  }
);
