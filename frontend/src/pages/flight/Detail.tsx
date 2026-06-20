import { useState, useEffect } from 'react';
import {
  Descriptions,
  Card,
  Button,
  Tag,
  Table,
  List,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Space,
  Alert,
  Timeline,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SwapOutlined,
  HistoryOutlined,
  RocketOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { UserRole, FlightStatus } from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  FlightStatusLabels,
  FlightChangeTypeLabels,
  formatDate,
} from '../../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleForm] = Form.useForm();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/flights/${id}`);
      setData(res.data);
    } catch (error) {
      console.error('Load detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canReschedule =
    (user?.role === UserRole.CUSTOMS_OFFICER || user?.role === UserRole.ADMIN) &&
    (data?.status === 'scheduled' ||
      data?.status === 'boarding' ||
      data?.status === FlightStatus.SCHEDULED ||
      data?.status === FlightStatus.BOARDING);

  const handleReschedule = async (values: any) => {
    try {
      const submitData: any = {
        changeType: values.changeType || 'reschedule',
        changeReason: values.changeReason,
        newFlightNo: values.newFlightNo,
        newAirline: values.newAirline,
        newDeparture: values.newDepartureCode,
        newDestination: values.newArrivalCode,
        newScheduledDepartureTime: values.newScheduledDeparture?.toISOString(),
        newScheduledArrivalTime: values.newScheduledArrival?.toISOString(),
        remarks: values.remarks,
      };
      await api.post(`/flight-changes/${id}/reschedule`, submitData);
      message.success('航班改签成功，已记录改签历史');
      setRescheduleModalOpen(false);
      rescheduleForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const sampleBoxColumns = [
    {
      title: '样本盒编码',
      dataIndex: 'boxCode',
      key: 'boxCode',
      width: 160,
      render: (v: string, r: any) => (
        <a onClick={() => navigate(`/sample-boxes/${r.id}`)} style={{ fontWeight: 500 }}>
          {v}
        </a>
      ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 140,
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag
          color={
            SampleBoxStatusColors[v as keyof typeof SampleBoxStatusColors] || 'default'
          }
        >
          {SampleBoxStatusLabels[v as keyof typeof SampleBoxStatusLabels] || v}
        </Tag>
      ),
    },
  ];

  const changeRecordColumns = [
    {
      title: '改签类型',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 120,
      render: (v: string) => <Tag color="blue">{FlightChangeTypeLabels[v] || v}</Tag>,
    },
    {
      title: '改签原因',
      dataIndex: 'changeReason',
      key: 'changeReason',
    },
    {
      title: '改签前',
      key: 'before',
      width: 280,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <div>
            <b>{r.oldFlightNo || data.flightNo}</b> {r.oldAirline}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {r.oldDepartureCode} → {r.oldArrivalCode}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            起飞：{formatDate(r.oldScheduledDeparture)}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            到达：{formatDate(r.oldScheduledArrival)}
          </div>
        </Space>
      ),
    },
    {
      title: '改签后',
      key: 'after',
      width: 280,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <div>
            <b>{r.newFlightNo || '-'}</b> {r.newAirline || ''}
          </div>
          <div style={{ fontSize: 12, color: '#52c41a' }}>
            {r.newDepartureCode} → {r.newArrivalCode}
          </div>
          <div style={{ fontSize: 12, color: '#52c41a' }}>
            起飞：{formatDate(r.newScheduledDeparture)}
          </div>
          <div style={{ fontSize: 12, color: '#52c41a' }}>
            到达：{formatDate(r.newScheduledArrival)}
          </div>
        </Space>
      ),
    },
    {
      title: '影响样本盒数',
      dataIndex: 'affectedSampleBoxCount',
      key: 'affectedSampleBoxCount',
      width: 120,
      render: (v: number) =>
        v != null ? <Tag color="orange">{v} 盒</Tag> : '-',
    },
    {
      title: '操作人/时间',
      key: 'op',
      width: 180,
      render: (_: any, r: any) => (
        <div>
          <div>{r.operatedByName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{formatDate(r.operatedAt)}</div>
        </div>
      ),
    },
  ];

  if (loading) return <div style={{ padding: 100 }}>加载中...</div>;
  if (!data)
    return (
      <div style={{ padding: 50 }}>
        <Card>航班不存在</Card>
      </div>
    );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/flights')}>
          返回列表
        </Button>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              <RocketOutlined style={{ marginRight: 6 }} />
              {data.flightNo}
            </span>
            <Tag color="blue">{data.airline}</Tag>
            <Tag
              color={
                data.status === 'arrived'
                  ? 'green'
                  : data.status === 'cancelled'
                  ? 'red'
                  : 'default'
              }
            >
              {FlightStatusLabels[data.status] || data.status}
            </Tag>
          </div>
        }
        extra={
          <Space>
            {canReschedule && (
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => {
                  rescheduleForm.setFieldsValue({
                    changeType: 'reschedule',
                    changeReason: '',
                    newFlightNo: data.flightNo,
                    newAirline: data.airline,
                    newDepartureCode: data.departureCode || data.departure,
                    newArrivalCode: data.arrivalCode || data.destination,
                    newScheduledDeparture: data.scheduledDepartureTime
                      ? dayjs(data.scheduledDepartureTime)
                      : dayjs().add(1, 'day').hour(8).minute(0),
                    newScheduledArrival: data.scheduledArrivalTime
                      ? dayjs(data.scheduledArrivalTime)
                      : dayjs().add(1, 'day').hour(14).minute(0),
                  });
                  setRescheduleModalOpen(true);
                }}
              >
                航班改签
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {data.isDelayed && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`航班延误 ${data.delayMinutes || 0} 分钟`}
            description={
              <div>
                <div>
                  <b>原因：</b>
                  {data.delayReason || '未上报'}
                </div>
                <div style={{ marginTop: 4 }}>
                  <SafetyOutlined style={{ color: '#faad14' }} />
                  延误超过 120 分钟将自动触发样本盒温度预警冻结机制，请及时关注。
                </div>
              </div>
            }
          />
        )}

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="出发地 → 目的地">
            <strong>{data.departure}</strong>（{data.departureCode || '—'}） →{' '}
            <strong>{data.destination}</strong>（{data.arrivalCode || '—'}）
          </Descriptions.Item>
          <Descriptions.Item label="关联样本盒数量">
            {data.sampleBoxes?.length || 0} 盒
          </Descriptions.Item>
          <Descriptions.Item label="计划起飞">
            {formatDate(data.scheduledDepartureTime)}
          </Descriptions.Item>
          <Descriptions.Item label="计划到达">
            {formatDate(data.scheduledArrivalTime)}
          </Descriptions.Item>
          <Descriptions.Item label="实际起飞">
            {formatDate(data.actualDepartureTime)}
          </Descriptions.Item>
          <Descriptions.Item label="实际到达">
            {formatDate(data.actualArrivalTime)}
          </Descriptions.Item>
          <Descriptions.Item label="延误情况" span={2}>
            {data.isDelayed ? (
              <Tag color="red">延误 {data.delayMinutes || 0} 分钟</Tag>
            ) : (
              <Tag color="green">准点</Tag>
            )}
            {data.delayReason && (
              <span style={{ marginLeft: 12, color: '#999' }}>
                原因：{data.delayReason}
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="报关专员" span={2}>
            {data.customsOfficerName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {data.remarks || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={
          <Space>
            <HistoryOutlined />
            航班改签记录（{(data.changeRecords || []).length}）
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {(data.changeRecords || []).length > 0 ? (
          <Table
            rowKey="id"
            columns={changeRecordColumns}
            dataSource={data.changeRecords || []}
            pagination={false}
            size="small"
            scroll={{ x: 1100 }}
          />
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            暂无改签记录
          </div>
        )}
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            关联样本盒 ({data.sampleBoxes?.length || 0})
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={sampleBoxColumns}
          dataSource={data.sampleBoxes || []}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
        />
      </Card>

      <Modal
        title={
          <Space>
            <SwapOutlined />
            航班改签
          </Space>
        }
        open={rescheduleModalOpen}
        onCancel={() => {
          setRescheduleModalOpen(false);
          rescheduleForm.resetFields();
        }}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="改签注意事项"
          description={
            <div>
              <div>• 改签前信息会自动记录到改签历史，可追溯</div>
              <div>• 改签后自动通知关联的样本盒负责人</div>
              <div>• 新航班信息请务必准确，影响报关流程</div>
            </div>
          }
        />
        <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="改签类型"
                name="changeType"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="reschedule">改签（同航线调整时间）</Option>
                  <Option value="reroute">改航线（变更起终点）</Option>
                  <Option value="cancel">取消航班</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="改签原因" name="changeReason" rules={[{ required: true }]}>
                <Select allowClear>
                  <Option value="weather">天气原因</Option>
                  <Option value="mechanical">机械故障</Option>
                  <Option value="crew">机组原因</Option>
                  <Option value="traffic">空中管制</Option>
                  <Option value="passenger">旅客原因</Option>
                  <Option value="customs">报关配合</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            新航班信息
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="新航班号"
                name="newFlightNo"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input placeholder="如：CA981" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="航空公司"
                name="newAirline"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input placeholder="如：中国国际航空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="出发机场代码"
                name="newDepartureCode"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input placeholder="如：PEK" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="到达机场代码"
                name="newArrivalCode"
                rules={[{ required: true, message: '请输入' }]}
              >
                <Input placeholder="如：JFK" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="计划起飞时间"
                name="newScheduledDeparture"
                rules={[{ required: true }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="计划到达时间"
                name="newScheduledArrival"
                rules={[{ required: true }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注说明" name="remarks">
                <TextArea rows={2} placeholder="补充说明（选填）" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRescheduleModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认改签
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FlightDetail;
