import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Tooltip,
  message,
  Card,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  FreezeReasonLabels,
  ApprovalStatusLabels,
  formatDate,
} from '../../utils/constants';

const { Option } = Select;
const { TextArea } = Input;

const FreezeList = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [sampleBoxId, setSampleBoxId] = useState<string | undefined>();
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>();
  const [freezeReason, setFreezeReason] = useState<string | undefined>();
  const [isThawed, setIsThawed] = useState<boolean | undefined>();
  const [isDestroyed, setIsDestroyed] = useState<boolean | undefined>();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [thawModalOpen, setThawModalOpen] = useState(false);
  const [destroyModalOpen, setDestroyModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [thawForm] = Form.useForm();
  const [destroyForm] = Form.useForm();

  const canCreate = user
    ? [UserRole.CENTRAL_LAB, UserRole.ADMIN].includes(user.role as UserRole)
    : false;
  const canApprove = user?.role === UserRole.ADMIN;
  const canThaw = user
    ? [UserRole.CENTRAL_LAB, UserRole.ADMIN].includes(user.role as UserRole)
    : false;
  const canDestroy = user
    ? [UserRole.CENTRAL_LAB, UserRole.ADMIN].includes(user.role as UserRole)
    : false;

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, sampleBoxId, approvalStatus, freezeReason, isThawed, isDestroyed]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (sampleBoxId) params.sampleBoxId = sampleBoxId;
      if (approvalStatus) params.approvalStatus = approvalStatus;
      if (freezeReason) params.freezeReason = freezeReason;
      if (isThawed !== undefined) params.isThawed = isThawed;
      if (isDestroyed !== undefined) params.isDestroyed = isDestroyed;

      const res = await api.get('/freeze-records', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load freeze records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await api.post('/freeze-records', values);
      message.success('冻结记录创建成功，已提交审批');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Create freeze record error:', error);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      const reason = approved
        ? undefined
        : (await new Promise<string | undefined>((resolve) => {
            Modal.confirm({
              title: '审批驳回',
              content: (
                <div>
                  <p style={{ marginBottom: 8 }}>请输入驳回原因：</p>
                  <TextArea
                    rows={3}
                    id="rejectReasonInput"
                    placeholder="请填写驳回原因"
                  />
                </div>
              ),
              okText: '确认驳回',
              cancelText: '取消',
              onOk: () => {
                const input = document.getElementById(
                  'rejectReasonInput'
                ) as HTMLTextAreaElement;
                resolve(input?.value || '审批驳回');
              },
              onCancel: () => resolve(undefined),
            });
          }));
      if (approved || reason) {
        await api.post(`/freeze-records/${id}/approve`, { approved, rejectionReason: reason });
        message.success(approved ? '审批通过' : '审批驳回');
        loadData();
      }
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleThaw = async (values: any) => {
    try {
      await api.post(`/freeze-records/${currentRecord.id}/thaw`, values);
      message.success('样本盒解冻成功');
      setThawModalOpen(false);
      thawForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Thaw error:', error);
    }
  };

  const handleDestroy = async (values: any) => {
    try {
      await api.post(`/freeze-records/${currentRecord.id}/destroy`, values);
      message.success('样本盒销毁成功');
      setDestroyModalOpen(false);
      destroyForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Destroy error:', error);
    }
  };

  const getFreezeReasonColor = (reason: string) => {
    switch (reason) {
      case 'temp_exceeded':
        return 'red';
      case 'flight_delay':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusTag = (record: any) => {
    if (record.isDestroyed) {
      return <Tag color="default" icon={<DeleteOutlined />}>已销毁</Tag>;
    }
    if (record.isThawed) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>已解冻</Tag>;
    }
    if (record.approvalStatus === 'pending') {
      return <Tag color="gold">待审批</Tag>;
    }
    if (record.approvalStatus === 'approved') {
      return <Tag color="red" icon={<SafetyOutlined />}>已冻结</Tag>;
    }
    if (record.approvalStatus === 'rejected') {
      return <Tag color="default" icon={<CloseCircleOutlined />}>审批驳回</Tag>;
    }
    return <Tag>{record.approvalStatus}</Tag>;
  };

  const columns = [
    {
      title: '发起时间',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
      width: 170,
      render: (v: string) => formatDate(v),
    },
    {
      title: '样本盒ID',
      dataIndex: 'sampleBoxId',
      key: 'sampleBoxId',
      width: 120,
      render: (v: string) => (
        <Tooltip title={v}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {v ? v.substring(0, 8) + '...' : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '冻结原因',
      dataIndex: 'freezeReason',
      key: 'freezeReason',
      width: 120,
      render: (v: string) => (
        <Tag
          icon={v === 'flight_delay' ? <ThunderboltOutlined /> : v === 'temp_exceeded' ? <SafetyOutlined /> : null}
          color={getFreezeReasonColor(v)}
        >
          {FreezeReasonLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '原因详情',
      dataIndex: 'freezeReasonDetail',
      key: 'freezeReasonDetail',
      width: 200,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      render: (_: any, r: any) => getStatusTag(r),
    },
    {
      title: '发起人',
      dataIndex: 'initiatedByName',
      key: 'initiatedByName',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '审批人',
      key: 'approver',
      width: 100,
      render: (_: any, r: any) => (
        <div>
          <div>{r.approverName || '-'}</div>
          {r.approvedAt && (
            <div style={{ fontSize: 11, color: '#999' }}>{formatDate(r.approvedAt)}</div>
          )}
        </div>
      ),
    },
    {
      title: '解冻/销毁',
      key: 'result',
      width: 160,
      render: (_: any, r: any) => (
        <div>
          {r.isThawed && (
            <div>
              <div style={{ color: '#52c41a', fontWeight: 500 }}>解冻</div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {r.thawedByName} · {formatDate(r.thawedAt)}
              </div>
              {r.thawReason && <div style={{ fontSize: 11 }}>{r.thawReason}</div>}
            </div>
          )}
          {r.isDestroyed && (
            <div>
              <div style={{ color: '#8c8c8c', fontWeight: 500 }}>销毁</div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {r.destroyedByName} · {formatDate(r.destroyedAt)}
              </div>
              {r.destroyReason && <div style={{ fontSize: 11 }}>{r.destroyReason}</div>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentRecord(r);
              setDetailModalOpen(true);
            }}
          >
            详情
          </Button>
          {canApprove && r.approvalStatus === 'pending' && !r.isThawed && !r.isDestroyed && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => handleApprove(r.id, true)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleApprove(r.id, false)}
              >
                驳回
              </Button>
            </>
          )}
          {canThaw && r.approvalStatus === 'approved' && !r.isThawed && !r.isDestroyed && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setCurrentRecord(r);
                setThawModalOpen(true);
              }}
            >
              解冻
            </Button>
          )}
          {canDestroy && !r.isDestroyed && r.isThawed && (
            <Popconfirm
              title="确认销毁该样本盒？"
              description="销毁后不可恢复，请确认"
              onConfirm={() => {
                setCurrentRecord(r);
                setDestroyModalOpen(true);
              }}
            >
              <Button type="link" size="small" danger>
                销毁
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>冻结处理</h2>
        {canCreate && (
          <Button
            type="primary"
            danger
            icon={<SafetyOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            手动冻结
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>样本盒ID：</span>
            <Input
              placeholder="输入样本盒ID"
              prefix={<SearchOutlined />}
              value={sampleBoxId}
              onChange={(e) => setSampleBoxId(e.target.value || undefined)}
              onPressEnter={() => {
                setPagination({ ...pagination, page: 1 });
                loadData();
              }}
              style={{ width: 200 }}
              allowClear
            />
          </Space>
          <Space>
            <span>冻结原因：</span>
            <Select
              placeholder="全部"
              value={freezeReason}
              onChange={(v) => {
                setFreezeReason(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 140 }}
              allowClear
            >
              {Object.entries(FreezeReasonLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <span>审批状态：</span>
            <Select
              placeholder="全部"
              value={approvalStatus}
              onChange={(v) => {
                setApprovalStatus(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 140 }}
              allowClear
            >
              {Object.entries(ApprovalStatusLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <span>结果：</span>
            <Select
              placeholder="全部"
              value={
                isThawed === undefined && isDestroyed === undefined
                  ? undefined
                  : isThawed
                  ? 'thawed'
                  : isDestroyed
                  ? 'destroyed'
                  : 'active'
              }
              onChange={(v) => {
                if (v === 'thawed') {
                  setIsThawed(true);
                  setIsDestroyed(undefined);
                } else if (v === 'destroyed') {
                  setIsThawed(undefined);
                  setIsDestroyed(true);
                } else if (v === 'active') {
                  setIsThawed(false);
                  setIsDestroyed(false);
                } else {
                  setIsThawed(undefined);
                  setIsDestroyed(undefined);
                }
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 140 }}
              allowClear
            >
              <Option value="active">处理中</Option>
              <Option value="thawed">已解冻</Option>
              <Option value="destroyed">已销毁</Option>
            </Select>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ ...pagination, page, pageSize }),
        }}
      />

      <Modal
        title="手动冻结样本盒"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="样本盒ID"
            name="sampleBoxId"
            rules={[{ required: true, message: '请输入样本盒ID' }]}
          >
            <Input placeholder="请输入样本盒ID" />
          </Form.Item>
          <Form.Item
            label="冻结原因"
            name="freezeReason"
            rules={[{ required: true, message: '请选择冻结原因' }]}
          >
            <Select placeholder="请选择冻结原因">
              {Object.entries(FreezeReasonLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="原因详情" name="freezeReasonDetail">
            <TextArea rows={3} placeholder="请详细描述冻结原因" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">
                确认冻结
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="样本盒解冻"
        open={thawModalOpen}
        onCancel={() => setThawModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={thawForm} layout="vertical" onFinish={handleThaw}>
          <Form.Item label="样本盒ID">
            <Input value={currentRecord?.sampleBoxId} disabled />
          </Form.Item>
          <Form.Item
            label="解冻原因"
            name="thawReason"
            rules={[{ required: true, message: '请输入解冻原因' }]}
          >
            <TextArea rows={3} placeholder="请详细描述解冻原因，如温度已恢复正常、问题已排查等" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setThawModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认解冻
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="样本盒销毁"
        open={destroyModalOpen}
        onCancel={() => setDestroyModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={destroyForm} layout="vertical" onFinish={handleDestroy}>
          <div
            style={{
              padding: 12,
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 12,
              color: '#cf1322',
            }}
          >
            ⚠️ 销毁操作不可撤销，样本盒将标记为永久销毁状态
          </div>
          <Form.Item label="样本盒ID">
            <Input value={currentRecord?.sampleBoxId} disabled />
          </Form.Item>
          <Form.Item
            label="销毁原因"
            name="destroyReason"
            rules={[{ required: true, message: '请输入销毁原因' }]}
          >
            <TextArea rows={3} placeholder="请详细描述销毁原因" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDestroyModalOpen(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">
                确认销毁
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="冻结记录详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={680}
        destroyOnClose
      >
        {currentRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="样本盒ID" span={2}>
              <span style={{ fontFamily: 'monospace' }}>{currentRecord.sampleBoxId}</span>
            </Descriptions.Item>
            <Descriptions.Item label="冻结原因">
              <Tag color={getFreezeReasonColor(currentRecord.freezeReason)}>
                {FreezeReasonLabels[currentRecord.freezeReason] || currentRecord.freezeReason}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(currentRecord)}
            </Descriptions.Item>
            <Descriptions.Item label="发起时间">{formatDate(currentRecord.initiatedAt)}</Descriptions.Item>
            <Descriptions.Item label="发起人">{currentRecord.initiatedByName || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批时间">{currentRecord.approvedAt ? formatDate(currentRecord.approvedAt) : '-'}</Descriptions.Item>
            <Descriptions.Item label="审批人">{currentRecord.approverName || '-'}</Descriptions.Item>
            <Descriptions.Item label="驳回原因" span={2}>
              {currentRecord.rejectionReason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="原因详情" span={2}>
              {currentRecord.freezeReasonDetail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="关联温度记录">
              {currentRecord.triggeredByTemperatureRecordId ? (
                <Tooltip title={currentRecord.triggeredByTemperatureRecordId}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {currentRecord.triggeredByTemperatureRecordId.substring(0, 12)}...
                  </span>
                </Tooltip>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="关联航班">
              {currentRecord.triggeredByFlightId ? (
                <Tooltip title={currentRecord.triggeredByFlightId}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {currentRecord.triggeredByFlightId.substring(0, 12)}...
                  </span>
                </Tooltip>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            {currentRecord.isThawed && (
              <>
                <Descriptions.Item label="解冻时间">{formatDate(currentRecord.thawedAt)}</Descriptions.Item>
                <Descriptions.Item label="解冻人">{currentRecord.thawedByName}</Descriptions.Item>
                <Descriptions.Item label="解冻原因" span={2}>
                  {currentRecord.thawReason}
                </Descriptions.Item>
              </>
            )}
            {currentRecord.isDestroyed && (
              <>
                <Descriptions.Item label="销毁时间">{formatDate(currentRecord.destroyedAt)}</Descriptions.Item>
                <Descriptions.Item label="销毁人">{currentRecord.destroyedByName}</Descriptions.Item>
                <Descriptions.Item label="销毁原因" span={2}>
                  {currentRecord.destroyReason}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="备注" span={2}>
              {currentRecord.remarks || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default FreezeList;
