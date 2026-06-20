import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface SampleTubeAttributes {
  id: string;
  tubeCode: string;
  sampleBoxId: string;
  subjectCode: string;
  studyNo?: string;
  sampleType?: string;
  sampleVolume?: number;
  collectionDate?: Date;
  storageCondition?: string;
  minTemp?: number;
  maxTemp?: number;
  ethicsApprovalNo?: string;
  ethicsApprovalVerified: boolean;
  boxSplitRecordId?: string;
  originalSampleBoxId?: string;
  seqNo: number;
  status: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleTubeCreationAttributes
  extends Optional<SampleTubeAttributes, 'id' | 'createdAt' | 'updatedAt' | 'ethicsApprovalVerified' | 'seqNo' | 'status'> {}

export class SampleTube extends Model<SampleTubeAttributes, SampleTubeCreationAttributes> implements SampleTubeAttributes {
  public id!: string;
  public tubeCode!: string;
  public sampleBoxId!: string;
  public subjectCode!: string;
  public studyNo?: string;
  public sampleType?: string;
  public sampleVolume?: number;
  public collectionDate?: Date;
  public storageCondition?: string;
  public minTemp?: number;
  public maxTemp?: number;
  public ethicsApprovalNo?: string;
  public ethicsApprovalVerified!: boolean;
  public boxSplitRecordId?: string;
  public originalSampleBoxId?: string;
  public seqNo!: number;
  public status!: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SampleTube.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tubeCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '样本管编号',
    },
    sampleBoxId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '当前所属样本盒ID',
      references: {
        model: 'sample_boxes',
        key: 'id',
      },
    },
    subjectCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '受试者编码',
    },
    studyNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '研究项目编号',
    },
    sampleType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '样本类型',
    },
    sampleVolume: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '样本体积(ml)',
    },
    collectionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '采集日期',
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
    ethicsApprovalNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '伦理批件编号',
    },
    ethicsApprovalVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '伦理批件是否已核验',
    },
    boxSplitRecordId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联分箱记录ID',
    },
    originalSampleBoxId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '原始样本盒ID（分箱前所属的母盒）',
    },
    seqNo: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '管内序号',
    },
    status: {
      type: DataTypes.STRING(30),
      defaultValue: 'active',
      comment: '样本管状态: active/split/merged/discarded',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'sample_tubes',
    indexes: [
      { fields: ['tube_code'], unique: true },
      { fields: ['sample_box_id'] },
      { fields: ['subject_code'] },
      { fields: ['ethics_approval_no'] },
      { fields: ['original_sample_box_id'] },
    ],
  }
);
