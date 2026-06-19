import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { DocumentType, DocumentStatus } from '../types/enums';

export interface DocumentAttributes {
  id: string;
  documentType: DocumentType;
  documentNo: string;
  sampleBoxId?: string;
  title: string;
  issueDate?: Date;
  validFrom?: Date;
  validUntil?: Date;
  issuingAuthority?: string;
  fileUrl?: string;
  status: DocumentStatus;
  createdById: string;
  createdByName: string;
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCreationAttributes
  extends Optional<DocumentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  public id!: string;
  public documentType!: DocumentType;
  public documentNo!: string;
  public sampleBoxId?: string;
  public title!: string;
  public issueDate?: Date;
  public validFrom?: Date;
  public validUntil?: Date;
  public issuingAuthority?: string;
  public fileUrl?: string;
  public status!: DocumentStatus;
  public createdById!: string;
  public createdByName!: string;
  public verifiedById?: string;
  public verifiedByName?: string;
  public verifiedAt?: Date;
  public remarks?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    documentType: {
      type: DataTypes.ENUM(...Object.values(DocumentType)),
      allowNull: false,
      comment: '单证类型',
    },
    documentNo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '单证编号',
    },
    sampleBoxId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联样本盒ID',
      references: {
        model: 'sample_boxes',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '单证标题',
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '签发日期',
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '有效期开始',
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '有效期截止',
    },
    issuingAuthority: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '签发机构',
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '单证文件URL',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.DRAFT,
      comment: '单证状态',
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建人ID',
    },
    createdByName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '创建人姓名',
    },
    verifiedById: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '核验人ID',
    },
    verifiedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '核验人姓名',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '核验时间',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
  } as any,
  {
    sequelize,
    tableName: 'documents',
    indexes: [
      { fields: ['document_no'], unique: true },
      { fields: ['sample_box_id'] },
      { fields: ['document_type'] },
      { fields: ['status'] },
    ],
  }
);
