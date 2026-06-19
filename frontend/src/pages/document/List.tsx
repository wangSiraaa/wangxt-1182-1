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
  DatePicker,
  Upload,
  message,
  Popconfirm,
  Card,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  DocumentTypeLabels,
  DocumentStatusLabels,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const DocumentList = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [docType, setDocType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [sampleBoxId, setSampleBoxId] = useState<string | undefined>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const canCreate = user
    ? [UserRole.CUSTOMS_OFFICER, UserRole.RESEARCH_CENTER, UserRole.ADMIN].includes(
        user.role as UserRole
      )
    : false;
  const canVerify = user
    ? [UserRole.CUSTOMS_OFFICER, UserRole.ADMIN].includes(user.role as UserRole)
    : false;
  const canDelete = user
    ? [UserRole.ADMIN, UserRole.CUSTOMS_OFFICER, UserRole.RESEARCH_CENTER].includes(
        user.role as UserRole
      )
    : false;

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, keyword, docType, status, sampleBoxId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (docType) params.documentType = docType;
      if (status) params.status = status;
      if (sampleBoxId) params.sampleBoxId = sampleBoxId;

      const res = await api.get('/documents', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const submitData = {
        ...values,
        issueDate: values.issueDate ? values.issueDate.toISOString() : null,
        validFrom: values.validFrom ? values.validFrom.toISOString() : null,
        validUntil: values.validUntil ? values.validUntil.toISOString() : null,
      };
      await api.post('/documents', submitData);
      message.success('单证创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Create document error:', error);
    }
  };

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await api.post(`/documents/${id}/verify`, { verified });
      message.success(verified ? '单证核验通过' : '单证已提交');
      loadData();
    } catch (error) {
      console.error('Verify error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const columns = [
    {
      title: '单证类型',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 130,
      render: (v: string) => (
        <Tag icon={<FileTextOutlined />} color="blue">
          {DocumentTypeLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '单证编号',
      dataIndex: 'documentNo',
      key: 'documentNo',
      width: 160,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '关联样本盒',
      dataIndex: 'sampleBoxId',
      key: 'sampleBoxId',
      width: 120,
      render: (v: string) => (v ? `已关联` : '-'),
    },
    {
      title: '签发机构',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: '签发/有效期',
      key: 'dates',
      width: 200,
      render: (_: any, r: any) => (
        <div style={{ fontSize: 12 }}>
          <div>签发：{formatDate(r.issueDate).split(' ')[0]}</div>
          {r.validUntil && (
            <div
              style={{
                color: new Date(r.validUntil) < new Date() ? '#ff4d4f' : '#999',
              }}
            >
              至：{formatDate(r.validUntil).split(' ')[0]}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '创建人',
      key: 'creator',
      width: 100,
      render: (_: any, r: any) => r.createdByName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Tag
          color={
            v === 'verified'
              ? 'green'
              : v === 'expired'
              ? 'red'
              : v === 'submitted'
              ? 'blue'
              : 'default'
          }
        >
          {DocumentStatusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          {canVerify && r.status !== 'verified' && r.status !== 'expired' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleVerify(r.id, true)}
            >
              核验通过
            </Button>
          )}
          {canDelete && r.status !== 'verified' && (
            <Popconfirm title="确定删除该单证？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>单证管理</h2>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建单证
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>关键字：</span>
            <Input
              placeholder="编号/标题/签发机构"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => {
                setPagination({ ...pagination, page: 1 });
                loadData();
              }}
              style={{ width: 240 }}
              allowClear
            />
          </Space>
          <Space>
            <span>类型：</span>
            <Select
              placeholder="全部"
              value={docType}
              onChange={(v) => {
                setDocType(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 160 }}
              allowClear
            >
              {Object.entries(DocumentTypeLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <span>状态：</span>
            <Select
              placeholder="全部"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 140 }}
              allowClear
            >
              {Object.entries(DocumentStatusLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
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
        scroll={{ x: 1300 }}
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
        title="新建单证"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="单证类型"
                name="documentType"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择单证类型">
                  {Object.entries(DocumentTypeLabels).map(([v, label]) => (
                    <Option key={v} value={v}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="单证编号"
                name="documentNo"
                rules={[{ required: true }]}
              >
                <Input placeholder="请输入单证编号" />
              </Form.Item>
            </div>
          </div>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入单证标题" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="签发机构" name="issuingAuthority">
                <Input placeholder="签发机构名称" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="关联样本盒ID" name="sampleBoxId">
                <Input placeholder="选填，关联样本盒" />
              </Form.Item>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="签发日期" name="issueDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="有效期开始" name="validFrom">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="有效期截止" name="validUntil">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>
          <Form.Item label="单证文件" name="fileUrl">
            <Upload>
              <Button icon={<UploadOutlined />}>点击上传文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认创建
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentList;
