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
  InputNumber,
  DatePicker,
  Tooltip,
  message,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  UploadOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  formatTemperature,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const SampleBoxList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (user) {
      setCanCreate(
        user.role === UserRole.RESEARCH_CENTER || user.role === UserRole.ADMIN
      );
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, keyword, status]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;

      const res = await api.get('/sample-boxes', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load sample boxes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const submitData = {
        ...values,
        ethicsApprovalValidUntil: values.ethicsApprovalValidUntil
          ? values.ethicsApprovalValidUntil.toISOString()
          : null,
      };
      await api.post('/sample-boxes', submitData);
      message.success('样本盒创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Create sample box error:', error);
    }
  };

  const columns = [
    {
      title: '样本盒编码',
      dataIndex: 'boxCode',
      key: 'boxCode',
      width: 160,
      render: (code: string, record: any) => (
        <a onClick={() => navigate(`/sample-boxes/${record.id}`)} style={{ fontWeight: 500 }}>
          {code}
        </a>
      ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 130,
      render: (code: string, record: any) => (
        <Space>
          <span>{code}</span>
          {record.subjectCodeLocked ? (
            <Tooltip title="到样确认后已锁定">
              <LockOutlined style={{ color: '#faad14', fontSize: 12 }} />
            </Tooltip>
          ) : (
            <Tooltip title="可编辑">
              <UnlockOutlined style={{ color: '#52c41a', fontSize: 12 }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '研究编号',
      dataIndex: 'studyNo',
      key: 'studyNo',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '样本数/类型',
      key: 'sample',
      width: 110,
      render: (_: any, record: any) => (
        <div>
          <div>{record.sampleCount || 0} 份</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.sampleType || '-'}</div>
        </div>
      ),
    },
    {
      title: '温度状态',
      key: 'temp',
      width: 140,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {formatTemperature(record.currentTemp)}
          </div>
          {record.minTemp != null || record.maxTemp != null ? (
            <div style={{ fontSize: 12, color: '#999' }}>
              {formatTemperature(record.minTemp)} ~ {formatTemperature(record.maxTemp)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '伦理批件',
      key: 'ethics',
      width: 160,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          {record.ethicsApprovalNo ? (
            <>
              <Tag color={record.ethicsApprovalVerified ? 'green' : 'gold'}>
                {record.ethicsApprovalVerified ? '已核验' : '待核验'}
              </Tag>
              <span style={{ fontSize: 12 }}>{record.ethicsApprovalNo}</span>
              {record.ethicsApprovalValidUntil && (
                <span
                  style={{
                    fontSize: 12,
                    color:
                      new Date(record.ethicsApprovalValidUntil) < new Date()
                        ? '#ff4d4f'
                        : '#999',
                  }}
                >
                  有效期至：{formatDate(record.ethicsApprovalValidUntil).split(' ')[0]}
                </span>
              )}
            </>
          ) : (
            <Tag color="red" icon={<UploadOutlined />}>
              缺失
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => (
        <Tag color={SampleBoxStatusColors[s as keyof typeof SampleBoxStatusColors] || 'default'}>
          {SampleBoxStatusLabels[s as keyof typeof SampleBoxStatusLabels] || s}
        </Tag>
      ),
    },
    {
      title: '研究中心',
      dataIndex: 'researchCenterName',
      key: 'researchCenterName',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/sample-boxes/${record.id}`)}
        >
          查看
        </Button>
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>样本盒管理</h2>
        <Space>
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              新建样本盒
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>关键字：</span>
            <Input
              placeholder="编码/受试者/研究编号"
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
            <span>状态：</span>
            <Select
              placeholder="全部"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 180 }}
              allowClear
            >
              {Object.entries(SampleBoxStatusLabels).map(([value, label]) => (
                <Option key={value} value={value}>
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
        scroll={{ x: 1400 }}
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
        title="新建样本盒"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ sampleCount: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="受试者编码"
                name="subjectCode"
                rules={[{ required: true, message: '请输入受试者编码' }]}
              >
                <Input placeholder="请输入受试者编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="研究编号" name="studyNo">
                <Input placeholder="请输入研究项目编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="样本数量"
                name="sampleCount"
                rules={[{ required: true, message: '请输入样本数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入样本份数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="样本类型" name="sampleType">
                <Select placeholder="请选择样本类型" allowClear>
                  <Option value="血液">血液</Option>
                  <Option value="血清">血清</Option>
                  <Option value="血浆">血浆</Option>
                  <Option value="尿液">尿液</Option>
                  <Option value="组织">组织</Option>
                  <Option value="唾液">唾液</Option>
                  <Option value="脑脊液">脑脊液</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="储存条件" name="storageCondition">
                <Select placeholder="请选择" allowClear>
                  <Option value="常温">常温</Option>
                  <Option value="冷藏(2-8℃)">冷藏(2-8℃)</Option>
                  <Option value="冷冻(-18℃以下)">冷冻(-18℃以下)</Option>
                  <Option value="深低温(-80℃)">深低温(-80℃)</Option>
                  <Option value="液氮(-196℃)">液氮(-196℃)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最低温度(℃)" name="minTemp">
                <InputNumber style={{ width: '100%' }} placeholder="下限温度" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="最高温度(℃)" name="maxTemp">
                <InputNumber style={{ width: '100%' }} placeholder="上限温度" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="伦理批件编号" name="ethicsApprovalNo">
                <Input placeholder="请输入伦理批件编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="伦理批件有效期至" name="ethicsApprovalValidUntil">
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remarks">
                <TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
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

export default SampleBoxList;
