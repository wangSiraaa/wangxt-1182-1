import { useState, useEffect } from 'react';
import { Descriptions, Card, Button, Tag, Table, List, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  FlightStatusLabels,
  formatDate,
} from '../../utils/constants';

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const sampleBoxColumns = [
    {
      title: '样本盒编码',
      dataIndex: 'boxCode',
      key: 'boxCode',
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
            <span style={{ fontSize: 18, fontWeight: 600 }}>{data.flightNo}</span>
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
        style={{ marginBottom: 16 }}
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="出发地 → 目的地">
            <strong>{data.departure}</strong> → <strong>{data.destination}</strong>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            关联样本盒 ({data.sampleBoxes?.length || 0})
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={sampleBoxColumns}
          dataSource={data.sampleBoxes || []}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default FlightDetail;
