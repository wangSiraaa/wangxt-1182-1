import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  RocketOutlined,
  EditOutlined,
  LinkOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../utils/enums';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  FlightStatusLabels,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const FlightList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [flightStatus, setFlightStatus] = useState<string | undefined>();
  const [date, setDate] = useState<any>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm] = Form.useForm();
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignForm] = Form.useForm();
  const [boxList, setBoxList] = useState<any[]>([]);

  const canManage = user
    ? [UserRole.CUSTOMS_OFFICER, UserRole.ADMIN].includes(user.role as UserRole)
    : false;

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, keyword, flightStatus, date]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (flightStatus) params.status = flightStatus;
      if (date && date.length === 2) {
        params.date = date[0].format('YYYY-MM-DD');
      }

      const res = await api.get('/flights', params);
      setData(res.data || []);
      setPagination({
        ...pagination,
        total: res.total || 0,
      });
    } catch (error) {
      console.error('Load flights error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableBoxes = async () => {
    try {
      const res = await api.get('/sample-boxes', {
        pageSize: 200,
        status: 'export_approved',
      });
      setBoxList(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const submitData = {
        ...values,
        scheduledDepartureTime: values.scheduledDepartureTime.toISOString(),
        scheduledArrivalTime: values.scheduledArrivalTime.toISOString(),
      };
      await api.post('/flights', submitData);
      message.success('航班创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    try {
      const submitData = {
        ...values,
        actualDepartureTime: values.actualDepartureTime
          ? values.actualDepartureTime.toISOString()
          : null,
        actualArrivalTime: values.actualArrivalTime
          ? values.actualArrivalTime.toISOString()
          : null,
      };
      await api.put(`/flights/${selectedFlight.id}/status`, submitData);
      message.success('航班状态更新成功');
      setStatusModalOpen(false);
      statusForm.resetFields();
      setSelectedFlight(null);
      loadData();
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleAssign = async (values: any) => {
    try {
      await api.post(`/flights/${selectedFlight.id}/assign-boxes`, {
        sampleBoxIds: values.sampleBoxIds,
      });
      message.success('样本盒关联成功');
      setAssignDrawerOpen(false);
      assignForm.resetFields();
      loadData();
    } catch (error) {
      console.error('Assign error:', error);
    }
  };

  const columns = [
    {
      title: '航班号',
      dataIndex: 'flightNo',
      key: 'flightNo',
      width: 120,
      render: (v: string, r: any) => (
        <a onClick={() => navigate(`/flights/${r.id}`)} style={{ fontWeight: 600 }}>
          {v}
        </a>
      ),
    },
    {
      title: '航空公司',
      dataIndex: 'airline',
      key: 'airline',
      width: 140,
    },
    {
      title: '航线',
      key: 'route',
      width: 200,
      render: (_: any, r: any) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{r.departure}</span>
          <RocketOutlined style={{ color: '#1890ff', transform: 'rotate(90deg)' }} />
          <span style={{ fontWeight: 500 }}>{r.destination}</span>
        </Space>
      ),
    },
    {
      title: '计划时间',
      key: 'schedule',
      width: 240,
      render: (_: any, r: any) => (
        <div style={{ fontSize: 12 }}>
          <div>起飞：{formatDate(r.scheduledDepartureTime)}</div>
          <div style={{ color: '#999', marginTop: 2 }}>
            到达：{formatDate(r.scheduledArrivalTime)}
          </div>
        </div>
      ),
    },
    {
      title: '延误情况',
      key: 'delay',
      width: 120,
      render: (_: any, r: any) =>
        r.isDelayed ? (
          <span style={{ color: '#ff4d4f' }}>
            <WarningOutlined /> 延误{r.delayMinutes}分钟
          </span>
        ) : (
          <span style={{ color: '#52c41a' }}>准点</span>
        ),
    },
    {
      title: '关联样本盒',
      dataIndex: 'sampleBoxIds',
      key: 'sampleBoxIds',
      width: 100,
      render: (ids: string[]) => (ids?.length || 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Tag
          color={
            v === 'arrived'
              ? 'green'
              : v === 'departed' || v === 'in_flight'
              ? 'blue'
              : v === 'cancelled'
              ? 'red'
              : 'default'
          }
        >
          {FlightStatusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          {canManage && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedFlight(r);
                statusForm.setFieldsValue({
                  status: r.status,
                  isDelayed: r.isDelayed,
                  delayMinutes: r.delayMinutes,
                  delayReason: r.delayReason,
                });
                setStatusModalOpen(true);
              }}
            >
              更新状态
            </Button>
          )}
          {canManage && (
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                setSelectedFlight(r);
                assignForm.setFieldsValue({
                  sampleBoxIds: r.sampleBoxIds || [],
                });
                loadAssignableBoxes();
                setAssignDrawerOpen(true);
              }}
            >
              关联样本
            </Button>
          )}
          {canManage &&
            !['departed', 'in_flight', 'landed', 'arrived'].includes(r.status) && (
              <Popconfirm
                title="确定删除该航班？"
                onConfirm={async () => {
                  await api.delete(`/flights/${r.id}`);
                  message.success('删除成功');
                  loadData();
                }}
              >
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>航班管理</h2>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新增航班
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>关键字：</span>
            <Input
              placeholder="航班号/航空公司/出发地"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => {
                setPagination({ ...pagination, page: 1 });
                loadData();
              }}
              style={{ width: 260 }}
              allowClear
            />
          </Space>
          <Space>
            <span>状态：</span>
            <Select
              placeholder="全部"
              value={flightStatus}
              onChange={(v) => {
                setFlightStatus(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 160 }}
              allowClear
            >
              {Object.entries(FlightStatusLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <span>日期：</span>
            <RangePicker
              value={date}
              onChange={(v) => {
                setDate(v);
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
        title="新增航班"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="航班号" name="flightNo" rules={[{ required: true }]}>
                <Input placeholder="如：CA1234" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="航空公司" name="airline" rules={[{ required: true }]}>
                <Input placeholder="如：中国国际航空" />
              </Form.Item>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="出发地" name="departure" rules={[{ required: true }]}>
                <Input placeholder="如：北京" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="目的地" name="destination" rules={[{ required: true }]}>
                <Input placeholder="如：纽约" />
              </Form.Item>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="计划起飞时间"
                name="scheduledDepartureTime"
                rules={[{ required: true }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="计划到达时间"
                name="scheduledArrivalTime"
                rules={[{ required: true }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>
          <Form.Item label="初始状态" name="status" initialValue="scheduled">
            <Select>
              {Object.entries(FlightStatusLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} />
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

      <Modal
        title={`更新航班状态 - ${selectedFlight?.flightNo || ''}`}
        open={statusModalOpen}
        onCancel={() => {
          setStatusModalOpen(false);
          statusForm.resetFields();
          setSelectedFlight(null);
        }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item label="航班状态" name="status" rules={[{ required: true }]}>
            <Select>
              {Object.entries(FlightStatusLabels).map(([v, label]) => (
                <Option key={v} value={v}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="实际起飞时间" name="actualDepartureTime">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="实际到达时间" name="actualArrivalTime">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: 0.5 }}>
              <Form.Item
                label="是否延误"
                name="isDelayed"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item label="延误时长(分钟)" name="delayMinutes">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="延误超过120分钟将自动冻结样本！"
                />
              </Form.Item>
            </div>
          </div>
          <Form.Item label="延误原因/备注" name="delayReason">
            <Input.TextArea rows={2} placeholder="超过120分钟会自动冻结关联样本盒" />
          </Form.Item>
          <Form.Item label="操作备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setStatusModalOpen(false);
                  statusForm.resetFields();
                  setSelectedFlight(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认更新
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Drawer
        title={`关联样本盒 - ${selectedFlight?.flightNo || ''}`}
        open={assignDrawerOpen}
        onClose={() => {
          setAssignDrawerOpen(false);
          assignForm.resetFields();
          setSelectedFlight(null);
        }}
        width={520}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setAssignDrawerOpen(false);
                  assignForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" onClick={assignForm.submit}>
                确认关联
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item
            label="选择样本盒（仅显示「出境审批通过」状态的样本）"
            name="sampleBoxIds"
            rules={[{ required: true, message: '请选择至少一个样本盒' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择样本盒"
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={boxList.map((box) => ({
                value: box.id,
                label: `${box.boxCode} - ${box.subjectCode}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default FlightList;
