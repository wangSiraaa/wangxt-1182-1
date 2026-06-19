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
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  ApprovalStatusLabels,
  formatDate,
} from '../../utils/constants';

const { Option } = Select;
const { TextArea } = Input;

const ApprovalTypeLabels: Record<string, string> = {
  export: '出境审批',
  freeze: '冻结审批',
  thaw: '解冻审批',
  destroy: '销毁审批',
};

const ApprovalTypeColors: Record<string, string> = {
  export: 'purple',
  freeze: 'red',
  thaw: 'green',
  destroy: 'default',
};

const ApprovalList = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [approvalType, setApprovalType] = useState<string | undefined>();
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>();
  const [initiatorId, setInitiatorId] = useState<string | undefined>();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectForm] = Form.useForm();

  const canApprove = user?.role === UserRole.ADMIN;

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, approvalType, approvalStatus, initiatorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (approvalType) params.approvalType = approvalType;
      if (approvalStatus) params.approvalStatus = approvalStatus;
      if (initiatorId) params.initiatorId = initiatorId;

      const res = await api.get('/approvals', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load approvals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/approvals/${currentRecord.id}/approve`, { approved: true });
      message.success('审批通过');
      setApproveModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (values: any) => {
    try {
      await api.post(`/approvals/${currentRecord.id}/approve`, {
        approved: false,
        rejectionReason: values.rejectionReason,
      });
      message.success('审批驳回');
      setRejectModalOpen(false);
      rejectForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'rejected':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'gold';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
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
      title: '审批类型',
      dataIndex: 'approvalType',
      key: 'approvalType',
      width: 120,
      render: (v: string) => (
        <Tag color={ApprovalTypeColors[v] || 'blue'}>
          {ApprovalTypeLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '业务ID',
      dataIndex: 'businessId',
      key: 'businessId',
      width: 120,
      render: (v: string) => (
        <Tooltip title={v}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {v ? v.substring(0, 10) + '...' : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '当前状态 → 目标',
      key: 'statusFlow',
      width: 180,
      render: (_: any, r: any) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <Tag color="blue" style={{ marginBottom: 4 }}>
              {r.currentStatus || '-'}
            </Tag>
          </div>
          <div style={{ color: '#999' }}>↓</div>
          <div>
            <Tag color="green">{r.targetStatus || '-'}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (v: string) => (
        <Tag icon={getStatusIcon(v)} color={getStatusColor(v)}>
          {ApprovalStatusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      key: 'initiatorName',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '审批人',
      key: 'approver',
      width: 150,
      render: (_: any, r: any) => (
        <div>
          <div>{r.approverName || <span style={{ color: '#bfbfbf' }}>待审批</span>}</div>
          {r.approvedAt && (
            <div style={{ fontSize: 11, color: '#999' }}>{formatDate(r.approvedAt)}</div>
          )}
        </div>
      ),
    },
    {
      title: '驳回原因',
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      width: 150,
      ellipsis: true,
      render: (v: string) => (v ? <span style={{ color: '#ff4d4f' }}>{v}</span> : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
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
          {canApprove && r.approvalStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => {
                  setCurrentRecord(r);
                  setApproveModalOpen(true);
                }}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => {
                  setCurrentRecord(r);
                  setRejectModalOpen(true);
                }}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = data.filter((d) => d.approvalStatus === 'pending').length;
  const approvedCount = data.filter((d) => d.approvalStatus === 'approved').length;
  const rejectedCount = data.filter((d) => d.approvalStatus === 'rejected').length;

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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>审批中心</h2>
        <Space size="large">
          <Space>
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <span>
              待审批：<strong style={{ color: '#faad14', fontSize: 16 }}>{pendingCount}</strong>
            </span>
          </Space>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <span>
              已通过：<strong style={{ color: '#52c41a', fontSize: 16 }}>{approvedCount}</strong>
            </span>
          </Space>
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            <span>
              已驳回：<strong style={{ color: '#ff4d4f', fontSize: 16 }}>{rejectedCount}</strong>
            </span>
          </Space>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>审批类型：</span>
            <Select
              placeholder="全部"
              value={approvalType}
              onChange={(v) => {
                setApprovalType(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 160 }}
              allowClear
            >
              {Object.entries(ApprovalTypeLabels).map(([v, label]) => (
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
            <span>发起人ID：</span>
            <Input
              placeholder="输入发起人ID"
              prefix={<SearchOutlined />}
              value={initiatorId}
              onChange={(e) => setInitiatorId(e.target.value || undefined)}
              onPressEnter={() => {
                setPagination({ ...pagination, page: 1 });
                loadData();
              }}
              style={{ width: 200 }}
              allowClear
            />
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
        scroll={{ x: 1600 }}
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
        title="审批记录详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={640}
        destroyOnClose
      >
        {currentRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="审批标题" span={2}>
              <strong>{currentRecord.title || '-'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="审批类型">
              <Tag color={ApprovalTypeColors[currentRecord.approvalType] || 'blue'}>
                {ApprovalTypeLabels[currentRecord.approvalType] || currentRecord.approvalType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="审批状态">
              <Tag icon={getStatusIcon(currentRecord.approvalStatus)} color={getStatusColor(currentRecord.approvalStatus)}>
                {ApprovalStatusLabels[currentRecord.approvalStatus] || currentRecord.approvalStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="业务类型">{currentRecord.businessType || '-'}</Descriptions.Item>
            <Descriptions.Item label="业务ID">
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {currentRecord.businessId || '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">{currentRecord.currentStatus || '-'}</Descriptions.Item>
            <Descriptions.Item label="目标状态">{currentRecord.targetStatus || '-'}</Descriptions.Item>
            <Descriptions.Item label="发起时间">{formatDate(currentRecord.initiatedAt)}</Descriptions.Item>
            <Descriptions.Item label="发起人">{currentRecord.initiatorName || '-'}</Descriptions.Item>
            {currentRecord.approvedAt && (
              <>
                <Descriptions.Item label="审批时间">{formatDate(currentRecord.approvedAt)}</Descriptions.Item>
                <Descriptions.Item label="审批人">{currentRecord.approverName || '-'}</Descriptions.Item>
              </>
            )}
            {currentRecord.rejectionReason && (
              <Descriptions.Item label="驳回原因" span={2} style={{ color: '#ff4d4f' }}>
                {currentRecord.rejectionReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="审批通过确认"
        open={approveModalOpen}
        onOk={handleApprove}
        onCancel={() => setApproveModalOpen(false)}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{ type: 'primary' }}
        width={480}
      >
        <div
          style={{
            padding: 16,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
          }}
        >
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#389e0d', marginBottom: 4 }}>
                确认通过该审批？
              </div>
              <div style={{ fontSize: 13, color: '#52c41a' }}>
                {currentRecord?.title}
              </div>
            </div>
          </Space>
        </div>
      </Modal>

      <Modal
        title="审批驳回"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <div
            style={{
              padding: 16,
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Space>
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#cf1322', marginBottom: 4 }}>
                  即将驳回该审批
                </div>
                <div style={{ fontSize: 13, color: '#cf1322' }}>
                  {currentRecord?.title}
                </div>
              </div>
            </Space>
          </div>
          <Form.Item
            label="驳回原因"
            name="rejectionReason"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述驳回原因，便于发起人修改后重新提交" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRejectModalOpen(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">
                确认驳回
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalList;
