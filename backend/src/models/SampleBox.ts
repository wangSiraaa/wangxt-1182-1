import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { SampleBoxStatus } from '../types/enums';

export interface SampleBoxAttributes {
  id: string;
  boxCode: string;
  subjectCode: string;
  subjectCodeLocked: boolean;
  studyNo?: string;
  sampleCount: number;
  sampleType?: string;
  storageCondition?: string;
  minTemp?: number;
  maxTemp?: number;
  currentTemp?: number;
  lastTempRecordAt?: Date;
  status: SampleBoxStatus;
  researchCenterId: string;
  researchCenterName: string;
  ethicsApprovalNo?: string;
  ethicsApprovalValidUntil?: Date;
  ethicsApprovalFile?: string;
  ethicsApprovalVerified: boolean;
  customsOfficerId?: string;
  centralLabId?: string;
  exportedAt?: Date;
  arrivedAt?: Date;
  tempConfirmedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleBoxCreationAttributes
  extends Optional<SampleBoxAttributes, 'id' | 'createdAt' | 'updatedAt' | 'subjectCodeLocked' | 'status' | 'ethicsApprovalVerified' | 'sampleCount'> {}

export class SampleBox extends Model<SampleBoxAttributes, SampleBoxCreationAttributes> implements SampleBoxAttributes {
  public id!: string;
  public boxCode!: string;
  public subjectCode!: string;
  public subjectCodeLocked!: boolean;
  public studyNo?: string;
  public sampleCount!: number;
  public sampleType?: string;
  public storageCondition?: string;
  public minTemp?: number;
  public maxTemp?: number;
  public currentTemp?: number;
  public lastTempRecordAt?: Date;
  public status!: SampleBoxStatus;
  public researchCenterId!: string;
  public researchCenterName!: string;
  public ethicsApprovalNo?: string;
  public ethicsApprovalValidUntil?: Date;
  public ethicsApprovalFile?: string;
  public ethicsApprovalVerified!: boolean;
  public customsOfficerId?: string;
  public centralLabId?: string;
  public exportedAt?: Date;
  public arrivedAt?: Date;
  public tempConfirmedAt?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SampleBox.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    boxCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '样本盒编码',
    },
    subjectCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '受试者编码',
    },
    subjectCodeLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '受试者编码是否锁定（到样确认后锁定）',
    },
    studyNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '研究项目编号',
    },
    sampleCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '样本数量',
    },
    sampleType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '样本类型',
    },
    storageCondition: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '储存条件',
    },
    minTemp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '最低温度限制',
    },
    maxTemp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '最高温度限制',
    },
    currentTemp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '当前温度',
    },
    lastTempRecordAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后温度记录时间',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SampleBoxStatus)),
      allowNull: false,
      defaultValue: SampleBoxStatus.DRAFT,
      comment: '样本盒状态',
    },
    researchCenterId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '研究中心用户ID',
    },
    researchCenterName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '研究中心名称',
    },
    ethicsApprovalNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '伦理批件编号',
    },
    ethicsApprovalValidUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '伦理批件有效期至',
    },
    ethicsApprovalFile: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '伦理批件文件路径',
    },
    ethicsApprovalVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '伦理批件是否已核验',
    },
    customsOfficerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '经办报关专员ID',
    },
    centralLabId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '经办中心实验室ID',
    },
    exportedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '出境时间',
    },
    arrivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '到样时间',
    },
    tempConfirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '温度确认时间',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'sample_boxes',
    indexes: [
      { fields: ['box_code'], unique: true },
      { fields: ['subject_code'] },
      { fields: ['status'] },
      { fields: ['research_center_id'] },
    ],
  }
);
