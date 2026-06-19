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
  Card,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  formatTemperature,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const SourceLabels: Record<string, string> = {
  manual: '人工录入',
  logistics_device: '物流设备',
  iot_sensor: 'IoT传感器',
};

const TemperatureList = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [sampleBoxId, setSampleBoxId] = useState<string | undefined>();
  const [isExceeded, setIsExceeded] = useState<boolean | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const canCreate = user
    ? [UserRole.CENTRAL_LAB, UserRole.CUSTOMS_OFFICER, UserRole.ADMIN].includes(
        user.role as UserRole
      )
    : false;

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, sampleBoxId, isExceeded, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (sampleBoxId) params.sampleBoxId = sampleBoxId;
      if (isExceeded !== undefined) params.isExceeded = isExceeded;
      if (dateRange && dateRange[0]) params.startDate = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) params.endDate = dateRange[1].toISOString();

      const res = await api.get('/temperature-records', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load temperature records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const submitData = {
        ...values,
        recordedAt: values.recordedAt ? values.recordedAt.toISOString() : new Date().toISOString(),
      };
      await api.post('/temperature-records', submitData);
      message.success(submitData.isExceeded ? '温度记录创建成功（已自动触发冻结）' : '温度记录创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Create temperature record error:', error);
    }
  };

  const columns = [
    {
      title: '记录时间',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      width: 170,
      render: (v: string) => formatDate(v),
      sorter: (a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
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
      title: '温度值',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 110,
      render: (v: number, record: any) => (
        <Space>
          <EnvironmentOutlined style={{ color: record.isExceeded ? '#ff4d4f' : '#52c41a' }} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: record.isExceeded ? '#ff4d4f' : '#262626',
            }}
          >
            {formatTemperature(v)}
          </span>
        </Space>
      ),
      sorter: (a: any, b: any) => Number(a.temperature) - Number(b.temperature),
    },
    {
      title: '是否超限',
      dataIndex: 'isExceeded',
      key: 'isExceeded',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Tag icon={<ExclamationCircleOutlined />} color="red">
            超限
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="green">
            正常
          </Tag>
        ),
    },
    {
      title: '数据来源',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (v: string) => SourceLabels[v] || v || '人工录入',
    },
    {
      title: '记录位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: '超限原因',
      dataIndex: 'exceededReason',
      key: 'exceededReason',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '处置措施',
      dataIndex: 'handlingAction',
      key: 'handlingAction',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '记录人',
      dataIndex: 'recordedByName',
      key: 'recordedByName',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '处置人',
      key: 'handler',
      width: 100,
      render: (_: any, r: any) => (
        <div>
          <div>{r.handlerName || '-'}</div>
          {r.handledAt && <div style={{ fontSize: 11, color: '#999' }}>{formatDate(r.handledAt)}</div>}
        </div>
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>温度记录</h2>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            录入温度
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
            <span>超限状态：</span>
            <Select
              placeholder="全部"
              value={isExceeded === undefined ? undefined : String(isExceeded)}
              onChange={(v) => {
                setIsExceeded(v === undefined ? undefined : v === 'true');
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 140 }}
              allowClear
            >
              <Option value="true">已超限</Option>
              <Option value="false">正常</Option>
            </Select>
          </Space>
          <Space>
            <span>记录时间：</span>
            <RangePicker
              showTime
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                setPagination({ ...pagination, page: 1 });
              }}
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
        title="录入温度记录"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="样本盒ID"
                name="sampleBoxId"
                rules={[{ required: true, message: '请输入样本盒ID' }]}
              >
                <Input placeholder="请输入样本盒ID" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="温度值(°C)"
                name="temperature"
                rules={[{ required: true, message: '请输入温度值' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入温度" />
              </Form.Item>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="记录时间" name="recordedAt">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="数据来源" name="source" initialValue="manual">
                <Select placeholder="请选择">
                  <Option value="manual">人工录入</Option>
                  <Option value="logistics_device">物流设备</Option>
                  <Option value="iot_sensor">IoT传感器</Option>
                </Select>
              </Form.Item>
            </div>
          </div>
          <Form.Item label="记录位置" name="location">
            <Input placeholder="如：机场中转、实验室入口等" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="是否超限" name="isExceeded">
                <Select placeholder="留空自动判定">
                  <Option value={true}>是（已超限）</Option>
                  <Option value={false}>否（正常）</Option>
                </Select>
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="超限原因" name="exceededReason">
                <Input placeholder="超限原因描述" />
              </Form.Item>
            </div>
          </div>
          <Form.Item label="处置措施" name="handlingAction">
            <Input placeholder="采取的处理措施" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
          <div
            style={{
              padding: 12,
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 12,
              color: '#ad6800',
            }}
          >
            💡 提示：若温度超出样本盒设定的 minTemp ~ maxTemp 范围，系统将自动冻结该样本盒
          </div>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认提交
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TemperatureList;
