import { useState, useEffect } from 'react';
import {
  Descriptions,
  Card,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Table,
  Timeline,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tabs,
  message,
  Popconfirm,
  Result,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  SendOutlined,
  LockOutlined,
  UnlockOutlined,
  FileOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  ScissorOutlined,
  ExperimentOutlined,
  LinkOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore, UserRoleLabels } from '../../store/auth';
import { UserRole, SampleBoxStatus, TemperatureReviewConclusion, BoxSplitStatus } from '../../utils/enums';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  DocumentTypeLabels,
  DocumentStatusLabels,
  FreezeReasonLabels,
  ApprovalStatusLabels,
  TemperatureReviewConclusionLabels,
  TemperatureReviewConclusionColors,
  SplitTypeLabels,
  BoxSplitStatusLabels,
  formatTemperature,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const SampleBoxDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [transitionModal, setTransitionModal] = useState<{
    open: boolean;
    toStatus: string;
    label: string;
  }>({ open: false, toStatus: '', label: '' });
  const [transitionForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [tempForm] = Form.useForm();
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitForm] = Form.useForm();
  const [abnormalConclusionModal, setAbnormalConclusionModal] = useState<{
    open: boolean;
    freezeRecordId: string;
  }>({ open: false, freezeRecordId: '' });
  const [abnormalConclusionForm] = Form.useForm();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sample-boxes/${id}`);
      setData(res.data);
    } catch (error) {
      console.error('Load detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (toStatus: string) => {
    try {
      const values = await transitionForm.validateFields();
      await api.post(`/sample-boxes/${id}/transition`, {
        toStatus,
        remark: values.remark,
      });
      message.success('状态流转成功');
      setTransitionModal({ open: false, toStatus: '', label: '' });
      transitionForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Transition error:', error);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        ethicsApprovalValidUntil: values.ethicsApprovalValidUntil
          ? values.ethicsApprovalValidUntil.toISOString()
          : null,
      };
      await api.put(`/sample-boxes/${id}`, submitData);
      message.success('更新成功');
      setEditModalOpen(false);
      editForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const handleTempRecord = async (values: any) => {
    try {
      await api.post('/temperature-records', {
        ...values,
        sampleBoxId: id,
        recordedAt: values.recordedAt ? values.recordedAt.toISOString() : undefined,
      });
      message.success('温度记录创建成功');
      setTempModalOpen(false);
      tempForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Temp record error:', error);
    }
  };

  const handleSplit = async (values: any) => {
    try {
      const targetBoxes =
        values.targetBoxes || [];
      const targetBoxCount = targetBoxes.filter(
        (b: any) => b.boxCode && b.sampleCount > 0
      );
      if (targetBoxCount.length < 1) {
        message.warning('请至少填写一个子盒');
        return;
      }
      const submitBoxes = targetBoxCount.map((b: any) => ({
        boxCode: b.boxCode,
        sampleCount: b.sampleCount,
        subjectCode: b.subjectCode || data.subjectCode,
      }));
      await api.post('/box-splits/split', {
        sourceBoxId: id,
        splitType: values.splitType || 'by_count',
        splitReason: values.splitReason,
        targetBoxes: submitBoxes,
      });
      message.success('分箱成功');
      setSplitModalOpen(false);
      splitForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAbnormalConclusion = async () => {
    try {
      const values = await abnormalConclusionForm.validateFields();
      if (data.subjectCodeLocked && values.subjectCode && values.subjectCode !== data.subjectCode) {
        message.error('到样确认后不能修改受试者编码，只能补充异常结论');
        return;
      }
      await api.post(
        `/temperature-reviews/freezing-records/${abnormalConclusionModal.freezeRecordId}/abnormal-conclusion`,
        {
          abnormalConclusion: values.abnormalConclusion,
          subjectCode: data.subjectCodeLocked ? undefined : values.subjectCode,
        }
      );
      message.success('异常结论补充成功');
      setAbnormalConclusionModal({ open: false, freezeRecordId: '' });
      abnormalConclusionForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReview = async (values: any) => {
    try {
      await api.post('/temperature-reviews', {
        ...values,
        sampleBoxId: id,
      });
      message.success('温度复核记录创建成功');
      setReviewModalOpen(false);
      reviewForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>加载中...</div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 50 }}>
        <Result
          status="404"
          title="样本盒不存在"
          extra={
            <Button type="primary" onClick={() => navigate('/sample-boxes')}>
              返回列表
            </Button>
          }
        />
      </div>
    );
  }

  const canEdit =
    data.canUpdateSubjectCode &&
    (user?.role === UserRole.RESEARCH_CENTER || user?.role === UserRole.ADMIN);

  const tempColumns = [
    {
      title: '温度值',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (v: number, r: any) => (
        <span style={{ color: r.isExceeded ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {formatTemperature(v)}
          {r.isExceeded && ' ⚠️'}
        </span>
      ),
    },
    {
      title: '记录时间',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      width: 160,
      render: formatDate,
    },
    {
      title: '记录人/来源',
      key: 'source',
      width: 160,
      render: (_: any, r: any) => (
        <div>
          <div>{r.recordedByName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{r.source}</div>
        </div>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '超限原因',
      dataIndex: 'exceededReason',
      key: 'exceededReason',
      render: (v: string) => v || '-',
    },
    {
      title: '处理措施',
      dataIndex: 'handlingAction',
      key: 'handlingAction',
      render: (v: string) => v || '-',
    },
  ];

  const freezeColumns = [
    {
      title: '冻结原因',
      dataIndex: 'freezeReason',
      key: 'freezeReason',
      width: 120,
      render: (v: string) => FreezeReasonLabels[v] || v,
    },
    {
      title: '详情',
      dataIndex: 'freezeReasonDetail',
      key: 'freezeReasonDetail',
      render: (v: string) => v || '-',
    },
    {
      title: '发起人/时间',
      key: 'init',
      width: 200,
      render: (_: any, r: any) => (
        <div>
          <div>{r.initiatedByName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatDate(r.initiatedAt)}</div>
        </div>
      ),
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (v: string) => (
        <Tag
          color={
            v === 'approved'
              ? 'green'
              : v === 'rejected'
              ? 'red'
              : 'gold'
          }
        >
          {ApprovalStatusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '处理情况',
      key: 'result',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={4}>
          <div>
            {r.isDestroyed ? (
              <Tag color="default">已销毁：{r.destroyReason}</Tag>
            ) : r.isThawed ? (
              <Tag color="green">已解冻：{r.thawReason}</Tag>
            ) : (
              <span style={{ color: '#999' }}>未处理</span>
            )}
          </div>
          {r.abnormalConclusion && (
            <div
              style={{
                marginTop: 4,
                padding: '6px 10px',
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 4,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: '#873800', fontWeight: 600 }}>异常结论：</div>
              <div style={{ color: '#333' }}>{r.abnormalConclusion}</div>
              <div style={{ marginTop: 2, color: '#999' }}>
                {r.abnormalConclusionByName || ''} ·{' '}
                {formatDate(r.abnormalConclusionAt)}
              </div>
            </div>
          )}
          <div>
            <Button
              type="link"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => {
                abnormalConclusionForm.setFieldsValue({
                  abnormalConclusion: r.abnormalConclusion || '',
                  subjectCode: data.subjectCode,
                });
                setAbnormalConclusionModal({ open: true, freezeRecordId: r.id });
              }}
              disabled={!(user?.role === UserRole.CENTRAL_LAB || user?.role === UserRole.ADMIN)}
            >
              {r.abnormalConclusion ? '补充' : '填写'}异常结论
            </Button>
          </div>
        </Space>
      ),
    },
  ];

  const tubeColumns = [
    {
      title: '序号',
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 70,
      render: (v: number) => (v != null ? `#${v}` : '-'),
    },
    {
      title: '管号',
      dataIndex: 'tubeCode',
      key: 'tubeCode',
      render: (v: string) => <b style={{ fontFamily: 'monospace' }}>{v}</b>,
    },
    {
      title: '母盒',
      dataIndex: 'originalSampleBoxCode',
      key: 'originalSampleBoxCode',
      render: (v: string, r: any) =>
        r.originalSampleBoxId && v ? (
          <Tooltip title="来自分箱前的母盒">
            <Tag color="purple">{v}</Tag>
          </Tooltip>
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      render: (v: string) => v || data.subjectCode || '-',
    },
    {
      title: '伦理批件号',
      dataIndex: 'ethicsApprovalNo',
      key: 'ethicsApprovalNo',
      render: (v: string) => v || data.ethicsApprovalNo || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
  ];

  const reviewColumns = [
    {
      title: '结论',
      dataIndex: 'conclusion',
      key: 'conclusion',
      width: 100,
      render: (v: string) => (
        <Tag
          color={
            TemperatureReviewConclusionColors[
              v as keyof typeof TemperatureReviewConclusionColors
            ] || 'default'
          }
        >
          {TemperatureReviewConclusionLabels[
            v as keyof typeof TemperatureReviewConclusionLabels
          ] || v}
        </Tag>
      ),
    },
    {
      title: '超限时长',
      dataIndex: 'exceededDurationMinutes',
      key: 'exceededDurationMinutes',
      width: 120,
      render: (v: number) => (v ? `${v} 分钟` : '-'),
    },
    {
      title: '结论说明',
      dataIndex: 'conclusionDetail',
      key: 'conclusionDetail',
    },
    {
      title: '复核后可用',
      dataIndex: 'isUsableAfterReview',
      key: 'isUsableAfterReview',
      width: 100,
      render: (v: boolean) =>
        v === undefined ? (
          '-'
        ) : v ? (
          <Tag color="green">可用</Tag>
        ) : (
          <Tag color="red">不可用</Tag>
        ),
    },
    {
      title: '后续步骤',
      dataIndex: 'nextStep',
      key: 'nextStep',
    },
    {
      title: '复核人/时间',
      key: 'operator',
      width: 200,
      render: (_: any, r: any) => (
        <div>
          <div>{r.reviewerName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatDate(r.reviewAt)}</div>
        </div>
      ),
    },
  ];

  const splitColumns = [
    {
      title: '分箱方式',
      dataIndex: 'splitType',
      key: 'splitType',
      render: (v: string) => SplitTypeLabels[v] || v,
    },
    {
      title: '源盒',
      dataIndex: 'sourceBoxCode',
      key: 'sourceBoxCode',
    },
    {
      title: '子盒数',
      key: 'targets',
      render: (_: any, r: any) =>
        r.targetBoxIds ? (
          <Tag color="blue">{r.targetBoxIds.length} 个</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '分箱原因',
      dataIndex: 'splitReason',
      key: 'splitReason',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === BoxSplitStatus.COMPLETED ? 'green' : 'blue'}>
          {BoxSplitStatusLabels[v as keyof typeof BoxSplitStatusLabels] || v}
        </Tag>
      ),
    },
    {
      title: '操作人/时间',
      key: 'op',
      render: (_: any, r: any) => (
        <div>
          <div>{r.operatedByName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatDate(r.operatedAt)}</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sample-boxes')}>
          返回列表
        </Button>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{data.boxCode}</span>
            <Tag
              color={
                SampleBoxStatusColors[
                  data.status as keyof typeof SampleBoxStatusColors
                ] || 'default'
              }
              style={{ fontSize: 14, padding: '2px 12px' }}
            >
              {SampleBoxStatusLabels[
                data.status as keyof typeof SampleBoxStatusLabels
              ] || data.status}
            </Tag>
            <span style={{ color: '#999' }}>
              受试者编码：{data.subjectCode}
              {data.subjectCodeLocked ? (
                <Tooltip title="到样确认后已锁定，不可修改">
                  <LockOutlined style={{ color: '#faad14', marginLeft: 8 }} />
                </Tooltip>
              ) : (
                <Tooltip title="可编辑">
                  <UnlockOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                </Tooltip>
              )}
            </span>
          </div>
        }
        extra={
          <Space wrap>
            {canEdit && (
              <Button
                onClick={() => {
                  editForm.setFieldsValue({
                    subjectCode: data.subjectCode,
                    studyNo: data.studyNo,
                    sampleCount: data.sampleCount,
                    sampleType: data.sampleType,
                    storageCondition: data.storageCondition,
                    minTemp: data.minTemp,
                    maxTemp: data.maxTemp,
                    ethicsApprovalNo: data.ethicsApprovalNo,
                    ethicsApprovalValidUntil: data.ethicsApprovalValidUntil
                      ? dayjs(data.ethicsApprovalValidUntil)
                      : null,
                    ethicsApprovalFile: data.ethicsApprovalFile,
                    ethicsApprovalVerified: data.ethicsApprovalVerified,
                    remarks: data.remarks,
                  });
                  setEditModalOpen(true);
                }}
              >
                编辑信息
              </Button>
            )}
            {(user?.role === UserRole.CENTRAL_LAB || user?.role === UserRole.ADMIN) && (
              <Button
                icon={<EnvironmentOutlined />}
                onClick={() => setTempModalOpen(true)}
              >
                录入温度
              </Button>
            )}
            {(user?.role === UserRole.CENTRAL_LAB || user?.role === UserRole.ADMIN) && (
              <Button icon={<ExperimentOutlined />} onClick={() => setReviewModalOpen(true)}>
                温度复核
              </Button>
            )}
            {(user?.role === UserRole.RESEARCH_CENTER || user?.role === UserRole.ADMIN) &&
              (data.status === SampleBoxStatus.DRAFT ||
                data.status === SampleBoxStatus.REGISTERED) && (
                <Button
                  icon={<ScissorOutlined />}
                  danger
                  onClick={() => {
                    splitForm.setFieldsValue({
                      splitType: 'by_count',
                      splitReason: '',
                      targetBoxes: [
                        { sampleCount: Math.ceil((data.sampleCount || 0) / 2) },
                        { sampleCount: Math.floor((data.sampleCount || 0) / 2) },
                      ],
                    });
                    setSplitModalOpen(true);
                  }}
                >
                  分箱出境
                </Button>
              )}
            {(user?.role === UserRole.CUSTOMS_OFFICER || user?.role === UserRole.ADMIN) && (
              <Button icon={<EyeOutlined />} onClick={() => navigate(`/customs/${id}`)}>
                报关视角
              </Button>
            )}
            {(data.availableTransitions || []).length > 0 && (
              <>
                {(data.availableTransitions || []).map((t: any) => (
                  <Popconfirm
                    key={t.to}
                    title={`确认${t.description}？`}
                    description={
                      t.to === SampleBoxStatus.TEMP_NORMAL ||
                      t.to === SampleBoxStatus.ARRIVED
                        ? '⚠️ 此操作将锁定受试者编码，之后不可修改！'
                        : ''
                    }
                    onConfirm={() =>
                      setTransitionModal({
                        open: true,
                        toStatus: t.to,
                        label: t.description,
                      })
                    }
                  >
                    <Button
                      type={
                        t.to === SampleBoxStatus.TEMP_NORMAL ||
                        t.to === SampleBoxStatus.EXPORT_APPROVED
                          ? 'primary'
                          : 'default'
                      }
                      danger={t.to === SampleBoxStatus.FROZEN}
                    >
                      {t.description}
                    </Button>
                  </Popconfirm>
                ))}
              </>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="研究编号">{data.studyNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="样本数量">{data.sampleCount || 0} 份</Descriptions.Item>
          <Descriptions.Item label="样本类型">{data.sampleType || '-'}</Descriptions.Item>
          <Descriptions.Item label="储存条件">{data.storageCondition || '-'}</Descriptions.Item>
          <Descriptions.Item label="温度范围">
            {formatTemperature(data.minTemp)} ~ {formatTemperature(data.maxTemp)}
          </Descriptions.Item>
          <Descriptions.Item label="当前温度">
            <span style={{ fontWeight: 600 }}>{formatTemperature(data.currentTemp)}</span>
            <div style={{ fontSize: 12, color: '#999' }}>
              {data.lastTempRecordAt ? `更新于 ${formatDate(data.lastTempRecordAt)}` : '暂无记录'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="研究中心">
            {data.researchCenterName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="出境时间">
            {formatDate(data.exportedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="到样时间">{formatDate(data.arrivedAt)}</Descriptions.Item>
          <Descriptions.Item label="温度确认时间">
            {formatDate(data.tempConfirmedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {formatDate(data.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {data.remarks || '-'}
          </Descriptions.Item>
        </Descriptions>

        {(data.documentGaps || []).length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
            message={`存在 ${data.documentGaps.length} 个单证缺口，可能影响出境流程`}
            description={
              <Space wrap size={[4, 4]}>
                {(data.documentGaps || []).map((g: any, idx: number) => (
                  <Tag color="red" key={idx}>
                    缺失：{DocumentTypeLabels[g.documentType] || g.documentType}
                  </Tag>
                ))}
              </Space>
            }
          />
        )}

        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>
            <FileOutlined style={{ marginRight: 6 }} />
            伦理批件信息
          </h4>
          {data.ethicsApprovalNo ? (
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="批件编号">
                {data.ethicsApprovalNo}
              </Descriptions.Item>
              <Descriptions.Item label="核验状态">
                <Tag color={data.ethicsApprovalVerified ? 'green' : 'gold'}>
                  {data.ethicsApprovalVerified ? '已核验' : '待核验'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="有效期至">
                <span
                  style={{
                    color:
                      data.ethicsApprovalValidUntil &&
                      new Date(data.ethicsApprovalValidUntil) < new Date()
                        ? '#ff4d4f'
                        : undefined,
                    fontWeight: data.ethicsApprovalValidUntil &&
                      new Date(data.ethicsApprovalValidUntil) < new Date()
                      ? 600
                      : undefined,
                  }}
                >
                  {formatDate(data.ethicsApprovalValidUntil).split(' ')[0]}
                </span>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div
              style={{
                padding: 16,
                background: '#fff1f0',
                border: '1px dashed #ffa39e',
                borderRadius: 6,
                color: '#cf1322',
                textAlign: 'center',
              }}
            >
              <strong>⛔ 伦理批件缺失！</strong>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                请尽快上传伦理批件，否则无法提交出境申请
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>流转状态</span>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <Timeline
          className="flow-timeline"
          mode="left"
          items={(data.flowLogs || [])
            .slice()
            .reverse()
            .map((log: any) => ({
              color:
                log.toStatus === SampleBoxStatus.FROZEN
                  ? 'red'
                  : log.toStatus === SampleBoxStatus.TEMP_ABNORMAL
                  ? 'orange'
                  : 'blue',
              label: formatDate(log.operatedAt),
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {log.fromStatus && (
                      <>
                        {
                          SampleBoxStatusLabels[
                            log.fromStatus as keyof typeof SampleBoxStatusLabels
                          ]
                        }{' '}
                        →{' '}
                      </>
                    )}
                    <Tag
                      color={
                        SampleBoxStatusColors[
                          log.toStatus as keyof typeof SampleBoxStatusColors
                        ] || 'default'
                      }
                    >
                      {
                        SampleBoxStatusLabels[
                          log.toStatus as keyof typeof SampleBoxStatusLabels
                        ]
                      }
                    </Tag>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13 }}>{log.description}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {log.operatorName}（{UserRoleLabels[log.operatorRole] || ''}）
                  </div>
                  {log.remark && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      备注：{log.remark}
                    </div>
                  )}
                </div>
              ),
            }))}
        />
        {(data.flowLogs || []).length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>
            暂无流转记录
          </div>
        )}
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'temp',
              label: `温度轨迹 (${(data.temperatureRecords || []).length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={tempColumns}
                  dataSource={data.temperatureRecords || []}
                  pagination={false}
                  size="small"
                />
              ),
            },
            {
              key: 'freeze',
              label: `冻结记录 (${(data.freezeRecords || []).length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={freezeColumns}
                  dataSource={data.freezeRecords || []}
                  pagination={false}
                  size="small"
                />
              ),
            },
            {
              key: 'docs',
              label: `关联单证 (${(data.documents || []).length})`,
              children: (
                <Descriptions bordered size="small" column={2}>
                  {(data.documents || []).length === 0 ? (
                    <Descriptions.Item span={2} style={{ textAlign: 'center' }}>
                      暂无关联单证
                    </Descriptions.Item>
                  ) : (
                    (data.documents || []).map((doc: any) => (
                      <Descriptions.Item
                        key={doc.id}
                        label={DocumentTypeLabels[doc.documentType] || doc.documentType}
                        span={1}
                      >
                        <Space direction="vertical" size={2}>
                          <span style={{ fontWeight: 500 }}>{doc.title}</span>
                          <span style={{ fontSize: 12 }}>编号：{doc.documentNo}</span>
                          <span>
                            <Tag
                              color={
                                doc.status === 'verified'
                                  ? 'green'
                                  : doc.status === 'expired'
                                  ? 'red'
                                  : 'gold'
                              }
                              style={{ margin: 0 }}
                            >
                              {DocumentStatusLabels[doc.status] || doc.status}
                            </Tag>
                          </span>
                        </Space>
                      </Descriptions.Item>
                    ))
                  )}
                </Descriptions>
              ),
            },
            {
              key: 'tubes',
              label: (
                <Space>
                  <LinkOutlined />
                  样本管 (${(data.sampleTubes || []).length})
                </Space>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={tubeColumns}
                  dataSource={data.sampleTubes || []}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              ),
            },
            {
              key: 'reviews',
              label: (
                <Space>
                  <ExperimentOutlined />
                  温度复核 (${(data.temperatureReviews || []).length})
                </Space>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={reviewColumns}
                  dataSource={data.temperatureReviews || []}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              ),
            },
            {
              key: 'splits',
              label: (
                <Space>
                  <ScissorOutlined />
                  分箱记录 (${(data.splitRecords || []).length})
                </Space>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={splitColumns}
                  dataSource={data.splitRecords || []}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={`确认：${transitionModal.label}`}
        open={transitionModal.open}
        onCancel={() => {
          setTransitionModal({ open: false, toStatus: '', label: '' });
          transitionForm.resetFields();
        }}
        onOk={() => handleTransition(transitionModal.toStatus)}
        okText="确认流转"
      >
        <Form form={transitionForm} layout="vertical">
          <Form.Item label="备注（选填）" name="remark">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑样本盒信息"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="受试者编码"
                name="subjectCode"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="研究编号" name="studyNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="样本数量"
                name="sampleCount"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="样本类型" name="sampleType">
                <Select allowClear>
                  <Option value="血液">血液</Option>
                  <Option value="血清">血清</Option>
                  <Option value="血浆">血浆</Option>
                  <Option value="尿液">尿液</Option>
                  <Option value="组织">组织</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="储存条件" name="storageCondition">
                <Select allowClear>
                  <Option value="常温">常温</Option>
                  <Option value="冷藏(2-8℃)">冷藏(2-8℃)</Option>
                  <Option value="冷冻(-18℃以下)">冷冻(-18℃以下)</Option>
                  <Option value="深低温(-80℃)">深低温(-80℃)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最低温度(℃)" name="minTemp">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最高温度(℃)" name="maxTemp">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="伦理批件编号" name="ethicsApprovalNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="有效期至" name="ethicsApprovalValidUntil">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认保存
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="录入温度记录"
        open={tempModalOpen}
        onCancel={() => {
          setTempModalOpen(false);
          tempForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={tempForm} layout="vertical" onFinish={handleTempRecord}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="温度值(℃)"
                name="temperature"
                rules={[{ required: true, message: '请输入' }]}
              >
                <InputNumber step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="数据来源"
                name="source"
                initialValue="manual"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="manual">人工录入</Option>
                  <Option value="logistics_device">物流设备</Option>
                  <Option value="iot_sensor">IoT传感器</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="记录时间" name="recordedAt" initialValue={dayjs()}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="记录地点" name="location">
                <Input placeholder="如：北京首都机场、实验室等" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否超限" name="isExceeded">
                <Select allowClear placeholder="自动判断">
                  <Option value={true}>是 - 超限</Option>
                  <Option value={false}>否 - 正常</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="超限原因" name="exceededReason">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="处理措施（选填）" name="handlingAction">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTempModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认录入
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ScissorOutlined />
            分箱出境
          </Space>
        }
        open={splitModalOpen}
        onCancel={() => {
          setSplitModalOpen(false);
          splitForm.resetFields();
        }}
        footer={null}
        width={860}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="分箱说明"
          description={
            <div>
              <div>• 同一研究中心同一受试者多管样本可拆分为多个子盒出境</div>
              <div>• 分箱后原盒将清零，所有样本管会保留原始母盒/分箱记录溯源</div>
              <div>• 子盒样本数量总和必须等于母盒样本数</div>
              <div>
                当前母盒：
                <Tag color="blue">{data.boxCode}</Tag> 共
                <Tag color="green">{data.sampleCount || 0}</Tag>
                管样本
              </div>
            </div>
          }
        />
        <Form form={splitForm} layout="vertical" onFinish={handleSplit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分箱方式"
                name="splitType"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="by_count">按数量分箱</Option>
                  <Option value="by_type">按类型分箱</Option>
                  <Option value="manual">手动分箱</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="分箱原因" name="splitReason">
                <Select allowClear placeholder="选择原因（选填）">
                  <Option value="split_export">分箱出境</Option>
                  <Option value="merge_error">原盒装箱错误</Option>
                  <Option value="shipment_requirement">物流要求</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            子盒配置
          </Divider>
          <Form.List name="targetBoxes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 12, background: '#fafafa' }}
                    title={`子盒 #${name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button danger size="small" onClick={() => remove(name)}>
                          删除
                        </Button>
                      ) : null
                    }
                  >
                    <Row gutter={12}>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          label="子盒编码"
                          name={[name, 'boxCode']}
                          rules={[{ required: true, message: '请输入子盒编码' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="例: BOX-SUB-001" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          label="样本管数"
                          name={[name, 'sampleCount']}
                          rules={[{ required: true }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          label="受试者"
                          name={[name, 'subjectCode']}
                          style={{ marginBottom: 0 }}
                          initialValue={data.subjectCode}
                        >
                          <Input placeholder="默认继承母盒" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 12 }}
                >
                  增加子盒
                </Button>
              </>
            )}
          </Form.List>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSplitModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" danger>
                <ScissorOutlined /> 确认分箱
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ExperimentOutlined />
            实验室补充异常结论
          </Space>
        }
        open={abnormalConclusionModal.open}
        onCancel={() => {
          setAbnormalConclusionModal({ open: false, freezeRecordId: '' });
          abnormalConclusionForm.resetFields();
        }}
        onOk={handleAddAbnormalConclusion}
        okText="确认补充"
        destroyOnClose
      >
        {data.subjectCodeLocked && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="受试者编码已锁定"
            description={`
              到样确认（温度确认）后，受试者编码已被锁定，只能补充异常结论，不能修改编码。
              当前受试者编码：${data.subjectCode}
            `}
          />
        )}
        <Form form={abnormalConclusionForm} layout="vertical">
          <Form.Item
            label={`受试者编码${data.subjectCodeLocked ? '（已锁定，不可修改）' : ''}`}
            name="subjectCode"
            rules={data.subjectCodeLocked ? [] : [{ required: true, message: '请输入' }]}
          >
            <Input disabled={data.subjectCodeLocked} />
          </Form.Item>
          <Form.Item
            label="异常结论"
            name="abnormalConclusion"
            rules={[{ required: true, message: '请填写异常结论' }]}
          >
            <TextArea
              rows={5}
              placeholder="请详细描述温度异常情况、样本状态评估、是否可用、后续处理建议等"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ExperimentOutlined />
            温度异常复核
          </Space>
        }
        open={reviewModalOpen}
        onCancel={() => {
          setReviewModalOpen(false);
          reviewForm.resetFields();
        }}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleCreateReview}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="复核结论"
                name="conclusion"
                initialValue={TemperatureReviewConclusion.PENDING}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value={TemperatureReviewConclusion.PENDING}>待复核</Option>
                  <Option value={TemperatureReviewConclusion.USABLE}>可用</Option>
                  <Option value={TemperatureReviewConclusion.UNUSABLE}>不可用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联冻结记录" name="freezeRecordId">
                <Select allowClear placeholder="选择冻结记录（选填）">
                  {(data.freezeRecords || []).map((fr: any) => (
                    <Option key={fr.id} value={fr.id}>
                      {formatDate(fr.initiatedAt)} - {FreezeReasonLabels[fr.freezeReason] || fr.freezeReason}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="超限时长(分钟)" name="exceededDurationMinutes">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="复核后是否可用"
                name="isUsableAfterReview"
                initialValue={null}
              >
                <Select allowClear>
                  <Option value={true}>是 - 可用</Option>
                  <Option value={false}>否 - 不可用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="结论详情"
                name="conclusionDetail"
                rules={[{ required: true, message: '请填写复核详情' }]}
              >
                <TextArea rows={4} placeholder="请详细描述复核结论依据" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="后续步骤建议" name="nextStep">
                <Input placeholder="如：继续运输、返回研究中心、销毁等" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="证据文件" name="evidenceFiles">
                <Input placeholder="文件路径/链接（多个用逗号分隔，选填）" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交复核
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SampleBoxDetail;
