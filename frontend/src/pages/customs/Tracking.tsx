import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Input,
  Button,
  Tooltip,
  Steps,
  Badge,
  List,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  BoxPlotOutlined,
  WarningOutlined,
  PlaneOutlined,
  SafetyOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  DocumentTypeLabels,
  formatDate,
  FLOW_NODE_DEFINITIONS,
} from '../../utils/constants';

const CustomsTracking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, keyword]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;

      const res = await api.get('/customs/tracking-summary', params);
      setData(res.data?.items || res.data || []);
      const s = res.data?.stats;
      setStats(s || null);
      if (res.total !== undefined) {
        setPagination({ ...pagination, total: Number(res.total) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '样本盒编码',
      dataIndex: 'boxCode',
      key: 'boxCode',
      render: (v: string, r: any) => (
        <a onClick={() => navigate(`/customs/${r.id}`)} style={{ fontWeight: 600 }}>
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
      title: '伦理批件号',
      dataIndex: 'ethicsApprovalNo',
      key: 'ethicsApprovalNo',
      render: (v: string) => (v || <span style={{ color: '#999' }}>-</span>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={SampleBoxStatusColors[v as keyof typeof SampleBoxStatusColors]}>
          {SampleBoxStatusLabels[v as keyof typeof SampleBoxStatusLabels] || v}
        </Tag>
      ),
    },
    {
      title: '当前节点',
      dataIndex: 'currentNode',
      key: 'currentNode',
      render: (node: any, r: any) => {
        if (!node) return <span style={{ color: '#999' }}>-</span>;
        const allNodes = r.flowNodes || FLOW_NODE_DEFINITIONS;
        const currentIndex = allNodes.findIndex((n: any) => n.key === r.status) + 1;
        return (
          <div style={{ width: 280 }}>
            <Steps
              size="small"
              current={currentIndex}
              status={r.status === 'FROZEN' || r.status === 'DESTROYED' ? 'error' : 'process'}
              items={allNodes.slice(0, 6).map((n: any) => ({
                title: (
                  <Tooltip title={n.label}>
                    <span style={{ fontSize: 11 }}>{n.label}</span>
                  </Tooltip>
                ),
              }))}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              责任方：<b>{node.role}</b>
            </div>
          </div>
        );
      },
    },
    {
      title: '单证缺口',
      dataIndex: 'documentGaps',
      key: 'documentGaps',
      render: (gaps: any[]) => {
        if (!gaps || gaps.length === 0) {
          return <Badge status="success" text="完整" />;
        }
        return (
          <Space wrap size={[4, 4]}>
            {gaps.map((g: any, idx: number) => (
              <Tag key={idx} color="red" style={{ margin: 0 }}>
                {DocumentTypeLabels[g.documentType] || g.documentType}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '航班',
      dataIndex: 'flight',
      key: 'flight',
      render: (f: any) =>
        f ? (
          <Tooltip title={`${f.airline || ''} ${f.departureCode || ''}→${f.arrivalCode || ''}`}>
            <span>
              <PlaneOutlined style={{ marginRight: 4 }} />
              {f.flightNo || '-'}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '温度范围',
      key: 'temp',
      render: (_: any, r: any) => (
        <span>
          {r.minTemp != null ? `${r.minTemp}°C` : '-'} ~{' '}
          {r.maxTemp != null ? `${r.maxTemp}°C` : '-'}
        </span>
      ),
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: any) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, r: any) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/customs/${r.id}`)}>
          详情
        </Button>
      ),
    },
  ];

  const statList = stats
    ? [
        {
          title: '样本盒总数',
          value: stats.total || 0,
          icon: <BoxPlotOutlined style={{ color: '#1890ff' }} />,
        },
        {
          title: '单证缺口',
          value: stats.docGaps || 0,
          icon: <WarningOutlined style={{ color: '#faad14' }} />,
        },
        {
          title: '运输中',
          value: stats.inTransit || 0,
          icon: <PlaneOutlined style={{ color: '#13c2c2' }} />,
        },
        {
          title: '冻结数',
          value: stats.frozen || 0,
          icon: <SafetyOutlined style={{ color: '#ff4d4f' }} />,
        },
      ]
    : [];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>报关流转追踪</h2>
        <p style={{ color: '#666', margin: '4px 0 0' }}>查看每盒样本当前节点与单证缺口</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statList.map((s, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={s.icon}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
        {statList.length === 0 && (
          <Col span={24}>
            <Empty description="加载统计中..." />
          </Col>
        )}
      </Row>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Space>
            <Input
              placeholder="搜索盒号/受试者/伦理号"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ ...pagination, page, pageSize }),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
};

export default CustomsTracking;
