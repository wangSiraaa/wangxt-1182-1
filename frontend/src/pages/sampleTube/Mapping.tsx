import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Tabs,
  Empty,
  Tooltip,
  Descriptions,
  Divider,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  LinkOutlined,
  BoxPlotOutlined,
  FileProtectOutlined,
  TeamOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { formatDate } from '../../utils/constants';

const TubeMapping = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [groupedByBox, setGroupedByBox] = useState<any[]>([]);
  const [groupedBySubject, setGroupedBySubject] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [boxCode, setBoxCode] = useState('');
  const [ethicsNo, setEthicsNo] = useState('');
  const [activeTab, setActiveTab] = useState('flat');

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (subjectCode) params.subjectCode = subjectCode;
      if (boxCode) params.boxCode = boxCode;
      if (ethicsNo) params.ethicsNo = ethicsNo;

      const res = await api.get('/sample-tubes/relation/mapping', params);
      setData(res.data?.tubes || res.data || []);
      setGroupedByBox(res.data?.groupedByBox || []);
      const bySubject: Record<string, any> = {};
      (res.data?.tubes || res.data || []).forEach((t: any) => {
        const key = t.subjectCode || 'unknown';
        if (!bySubject[key]) {
          bySubject[key] = {
            subjectCode: key,
            tubes: [],
            boxes: new Set<string>(),
            ethics: new Set<string>(),
            totalCount: 0,
          };
        }
        bySubject[key].tubes.push(t);
        bySubject[key].boxes.add(t.sampleBoxCode || t.sampleBoxId);
        bySubject[key].ethics.add(t.ethicsApprovalNo || '-');
        bySubject[key].totalCount += 1;
      });
      setGroupedBySubject(Object.values(bySubject));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const flatColumns = [
    {
      title: '管号',
      dataIndex: 'tubeCode',
      key: 'tubeCode',
      render: (v: string) => <b style={{ fontFamily: 'monospace' }}>{v}</b>,
      width: 180,
    },
    {
      title: '样本盒',
      dataIndex: 'sampleBoxCode',
      key: 'sampleBoxCode',
      width: 180,
      render: (v: string, r: any) =>
        v ? (
          <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sample-boxes/${r.sampleBoxId}`)}>
            {v}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '母盒（分箱前）',
      dataIndex: 'originalSampleBoxCode',
      key: 'originalSampleBoxCode',
      width: 180,
      render: (v: string, r: any) =>
        r.originalSampleBoxId && v ? (
          <Tooltip title="来自分箱前的母盒">
            <Tag color="purple"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/sample-boxes/${r.originalSampleBoxId}`)}
            >
              {v}
            </Tag>
          </Tooltip>
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 160,
      render: (v: string) =>
        v ? (
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <b>{v}</b>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '伦理批件号',
      dataIndex: 'ethicsApprovalNo',
      key: 'ethicsApprovalNo',
      width: 220,
      render: (v: string) =>
        v ? (
          <Space>
            <FileProtectOutlined style={{ color: '#52c41a' }} />
            <span>{v}</span>
            {v && <Tag color="green">已验证</Tag>}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '研究编号',
      dataIndex: 'studyNo',
      key: 'studyNo',
    },
    {
      title: '序号',
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 80,
      render: (v: any) => (v != null ? `#${v}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) =>
        v ? <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> : '-',
    },
    {
      title: '登记时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
  ];

  const groupedBoxColumns = [
    {
      title: '样本盒',
      dataIndex: 'boxCode',
      key: 'boxCode',
      render: (v: string, r: any) => (
        <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sample-boxes/${r.sampleBoxId}`)}>
          <b>{v}</b>
        </Tag>
      ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      render: (v: string) => v || '-',
    },
    {
      title: '伦理批件号',
      dataIndex: 'ethicsApprovalNo',
      key: 'ethicsApprovalNo',
      render: (v: string) => v || '-',
    },
    {
      title: '管数',
      dataIndex: 'tubeCount',
      key: 'tubeCount',
      render: (v: number) => <Tag color="blue">{v} 管</Tag>,
    },
    {
      title: '样本管列表',
      dataIndex: 'tubeCodes',
      key: 'tubeCodes',
      render: (codes: string[]) => (
        <Space wrap size={[4, 4]}>
          {codes.map((c, i) => (
            <Tag key={i} style={{ fontFamily: 'monospace', margin: 0 }}>
              {c}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const subjectColumns = [
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 160,
      render: (v: string) =>
        v ? (
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <b style={{ fontSize: 15 }}>{v}</b>
          </Space>
        ) : (
          '未指定'
        ),
    },
    {
      title: '总样本管数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 120,
      render: (v: number) => <Tag color="green">{v} 管</Tag>,
    },
    {
      title: '涉及样本盒',
      dataIndex: 'boxes',
      key: 'boxes',
      render: (set: Set<string>) => (
        <Space wrap size={[4, 4]}>
          {Array.from(set).map((v, i) => (
            <Tag key={i} color="blue">
              {v}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '涉及伦理批件',
      dataIndex: 'ethics',
      key: 'ethics',
      render: (set: Set<string>) => (
        <Space wrap size={[4, 4]}>
          {Array.from(set).map((v, i) => (
            <Tag key={i} color="green">
              {v}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const summaryCards = [
    {
      title: '总样本管数',
      value: data.length,
      icon: <FileOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: '涉及样本盒数',
      value: groupedByBox.length,
      icon: <BoxPlotOutlined style={{ color: '#722ed1' }} />,
    },
    {
      title: '涉及受试者数',
      value: groupedBySubject.length,
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
    },
    {
      title: '已验证伦理批件',
      value: data.filter((t) => t.ethicsApprovalVerified).length,
      icon: <FileProtectOutlined style={{ color: '#faad14' }} />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Space align="center">
          <LinkOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>样本对应关系查询</h2>
            <p style={{ color: '#666', margin: '2px 0 0' }}>
              盒号 / 样本号 / 伦理批件 / 受试者编码 多维度关联查询
            </p>
          </div>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {summaryCards.map((c, idx) => (
          <Col xs={24} sm={12} md={6} key={idx}>
            <Card size="small">
              <Space>
                <div style={{ fontSize: 28 }}>{c.icon}</div>
                <div>
                  <div style={{ color: '#888', fontSize: 12 }}>{c.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>全局搜索</div>
            <Input
              prefix={<SearchOutlined />}
              placeholder="管号/盒号/受试者/伦理号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>样本盒</div>
            <Input
              placeholder="按盒号筛选"
              value={boxCode}
              onChange={(e) => setBoxCode(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>受试者编码</div>
            <Input
              placeholder="按受试者编码筛选"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={loadData}
                style={{ minWidth: 100 }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setKeyword('');
                  setBoxCode('');
                  setSubjectCode('');
                  setEthicsNo('');
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'flat',
              label: (
                <Space>
                  <FileOutlined /> 平铺列表（{data.length}）
                </Space>
              ),
              children: (
                <Table
                  columns={flatColumns}
                  dataSource={data}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条样本管记录`,
                  }}
                  scroll={{ x: 1400 }}
                />
              ),
            },
            {
              key: 'grouped',
              label: (
                <Space>
                  <BoxPlotOutlined /> 按样本盒分组（{groupedByBox.length}）
                </Space>
              ),
              children: (
                <Table
                  columns={groupedBoxColumns}
                  dataSource={groupedByBox}
                  rowKey="sampleBoxId"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  expandable={{
                    expandedRowRender: (row) => (
                      <Descriptions column={3} size="small" bordered>
                        <Descriptions.Item label="样本盒">
                          <Tag color="blue" onClick={() => navigate(`/sample-boxes/${row.sampleBoxId}`)} style={{cursor:'pointer'}}>
                            {row.boxCode}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="受试者编码">{row.subjectCode || '-'}</Descriptions.Item>
                        <Descriptions.Item label="伦理批件">{row.ethicsApprovalNo || '-'}</Descriptions.Item>
                        <Descriptions.Item label="管数" span={3}>
                          <b>{row.tubeCount}</b> 管
                          <Divider type="vertical" />
                          {row.tubeCodes.map((c, i) => (
                            <Tag key={i} style={{ fontFamily: 'monospace', marginBottom: 4 }}>
                              {c}
                            </Tag>
                          ))}
                        </Descriptions.Item>
                      </Descriptions>
                    ),
                  }}
                />
              ),
            },
            {
              key: 'subject',
              label: (
                <Space>
                  <TeamOutlined /> 按受试者分组（{groupedBySubject.length}）
                </Space>
              ),
              children: (
                <Table
                  columns={subjectColumns}
                  dataSource={groupedBySubject}
                  rowKey="subjectCode"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  expandable={{
                    expandedRowRender: (row) => (
                      <Table
                        size="small"
                        columns={flatColumns}
                        dataSource={row.tubes}
                        rowKey="id"
                        pagination={false}
                      />
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 20 }}
        message="关于对应关系保留"
        description={
          <ul style={{ margin: 0, paddingLeft: 20, color: '#555' }}>
            <li>分箱操作时，样本管会保留「原始母盒ID」和「分箱记录ID」，支持跨盒溯源</li>
            <li>每个样本管同时记录 盒号 / 样本管号 / 伦理批件号 / 受试者编码 四个维度</li>
            <li>盒号可展开跳转到样本盒详情页面</li>
          </ul>
        }
      />
    </div>
  );
};

export default TubeMapping;
