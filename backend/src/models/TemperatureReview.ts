import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { TemperatureReviewConclusion } from '../types/enums';

export interface TemperatureReviewAttributes {
  id: string;
  sampleBoxId: string;
  freezeRecordId?: string;
  temperatureRecordId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewAt: Date;
  conclusion: TemperatureReviewConclusion;
  conclusionDetail?: string;
  maxExceededTemp?: number;
  minExceededTemp?: number;
  exceededDurationMinutes?: number;
  isUsableAfterReview?: boolean;
  evidenceFiles?: string[];
  nextStep?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemperatureReviewCreationAttributes
  extends Optional<TemperatureReviewAttributes, 'id' | 'createdAt' | 'updatedAt' | 'reviewAt'> {}

export class TemperatureReview extends Model<TemperatureReviewAttributes, TemperatureReviewCreationAttributes> implements TemperatureReviewAttributes {
  public id!: string;
  public sampleBoxId!: string;
  public freezeRecordId?: string;
  public temperatureRecordId?: string;
  public reviewerId!: string;
  public reviewerName!: string;
  public reviewAt!: Date;
  public conclusion!: TemperatureReviewConclusion;
  public conclusionDetail?: string;
  public maxExceededTemp?: number;
  public minExceededTemp?: number;
  public exceededDurationMinutes?: number;
  public isUsableAfterReview?: boolean;
  public evidenceFiles?: string[];
  public nextStep?: string;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TemperatureReview.init(
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
    freezeRecordId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联冻结记录ID',
    },
    temperatureRecordId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联温度记录ID',
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '复核人ID',
    },
    reviewerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '复核人姓名',
    },
    reviewAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '复核时间',
    },
    conclusion: {
      type: DataTypes.ENUM(...Object.values(TemperatureReviewConclusion)),
      allowNull: false,
      defaultValue: TemperatureReviewConclusion.PENDING,
      comment: '复核结论: usable可用, unusable不可用, pending待复核',
    },
    conclusionDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '复核结论详细说明',
    },
    maxExceededTemp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '超限最高温度',
    },
    minExceededTemp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '超限最低温度',
    },
    exceededDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '超限持续时长（分钟）',
    },
    isUsableAfterReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: null,
      comment: '复核后样本是否可用',
    },
    evidenceFiles: {
      type: DataTypes.ARRAY(DataTypes.STRING(500)),
      allowNull: true,
      comment: '证明材料文件路径',
    },
    nextStep: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '后续处理建议',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'temperature_reviews',
    indexes: [
      { fields: ['sample_box_id'] },
      { fields: ['freeze_record_id'] },
      { fields: ['conclusion'] },
      { fields: ['review_at'] },
    ],
  }
);
