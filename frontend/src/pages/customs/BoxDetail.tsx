import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  Steps,
  Table,
  Timeline,
  Alert,
  List,
  Empty,
  Divider,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  BoxPlotOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  RocketOutlined,
  ThermometerOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import {
  SampleBoxStatusLabels,
  SampleBoxStatusColors,
  DocumentTypeLabels,
  DocumentStatusLabels,
  TemperatureReviewConclusionLabels,
  TemperatureReviewConclusionColors,
  formatDate,
  formatTemperature,
  FLOW_NODE_DEFINITIONS,
} from '../../utils/constants';

const CustomsBoxDetail = () => {
  const navigate = useNavigate();
  const { boxId } = useParams<{ boxId: string }>();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    loadDetail();
  }, [boxId]);

  const loadDetail = async () => {
    if (!boxId) return;
    try {
      setLoading(true);
      const res = await api.get(`/customs/box-detail/${boxId}`);
      setDetail(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!detail && !loading) {
    return <Empty description="加载失败" />;
  }

  const box = detail?.sampleBox || detail;
  const currentNode = detail?.currentNode || null;
  const flowNodes = detail?.flowNodes || FLOW_NODE_DEFINITIONS;
  const documentGaps = detail?.documentGaps || [];
  const nextNode = detail?.nextNode || null;
  const relatedFlight = detail?.relatedFlight || null;
  const sampleTubes = detail?.sampleTubes || [];
  const flowLogs = detail?.flowLogs || box?.flowLogs || [];
  const temperatureRecords = detail?.temperatureRecords || box?.temperatureRecords || [];
  const temperatureReviews = detail?.temperatureReviews || box?.temperatureReviews || [];
  const freezeRecords = detail?.freezeRecords || box?.freezeRecords || [];

  const currentIndex = flowNodes.findIndex((n: any) => n.key === box.status) + 1;

  const docColumns = [
    {
      title: '单证类型',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (v: string) => DocumentTypeLabels[v] || v,
    },
    {
      title: '单证编号',
      dataIndex: 'documentNo',
      key: 'documentNo',
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'verified' ? 'green' : v === 'rejected' ? 'red' : 'blue'}>
          {DocumentStatusLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '签发机构',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
      render: (v: string) => v || '-',
    },
    {
      title: '有效期至',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (v: string) => formatDate(v),
    },
  ];

  const tubeColumns = [
    {
      title: '管号',
      dataIndex: 'tubeCode',
      key: 'tubeCode',
      render: (v: string) => <b>{v}</b>,
    },
    {
      title: '盒号',
      dataIndex: 'sampleBoxCode',
      key: 'sampleBoxCode',
      render: (v: string) => (
        <Tooltip title="当前样本盒">
          <Tag color="blue">{v || box.boxCode}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '受试者编码',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      render: (v: string) => v || box.subjectCode,
    },
    {
      title: '伦理批件号',
      dataIndex: 'ethicsApprovalNo',
      key: 'ethicsApprovalNo',
      render: (v: string) => v || box.ethicsApprovalNo || '-',
    },
    {
      title: '序号',
      dataIndex: 'seqNo',
      key: 'seqNo',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  const tempColumns = [
    {
      title: '时间',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (v: number, r: any) => (
        <span
          style={{
            color: r.isAbnormal ? '#ff4d4f' : '#52c41a',
            fontWeight: r.isAbnormal ? 700 : 500,
          }}
        >
          {formatTemperature(v)}
        </span>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>
          <BoxPlotOutlined style={{ marginRight: 8 }} />
          样本盒流转详情
        </h2>
      </Space>

      {documentGaps.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          message="存在单证缺口"
          description={
            <Space wrap>
              {documentGaps.map((g: any, idx: number) => (
                <Tag color="red" key={idx}>
                  缺失：{DocumentTypeLabels[g.documentType] || g.documentType}
                </Tag>
              ))}
            </Space>
          }
        />
      )}

      {nextNode && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          style={{ marginBottom: 16 }}
          message={`下一节点：${nextNode.label}（责任方：${nextNode.role}）`}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="盒号">
                <b>{box.boxCode}</b>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={SampleBoxStatusColors[box.status as keyof typeof SampleBoxStatusColors]}>
                  {SampleBoxStatusLabels[box.status as keyof typeof SampleBoxStatusLabels]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="受试者编码">
                {box.subjectCode}{' '}
                {box.subjectCodeLocked && <Tag color="red">已锁定</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="研究编号">{box.studyNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="伦理批件号">
                {box.ethicsApprovalNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="样本管数">
                {box.sampleCount || sampleTubes.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="温度要求">
                {formatTemperature(box.minTemp)} ~ {formatTemperature(box.maxTemp)}
              </Descriptions.Item>
              <Descriptions.Item label="研究中心">{box.researchCenterName || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前节点">
                {currentNode ? (
                  <b>
                    {currentNode.order}. {currentNode.label}（{currentNode.role}）
                  </b>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(box.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                流转进度
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Steps
              size="small"
              current={currentIndex}
              status={
                box.status === 'FROZEN' || box.status === 'DESTROYED' ? 'error' : 'process'
              }
              direction="vertical"
              style={{ marginTop: 8 }}
              items={flowNodes.map((n: any) => ({
                title: (
                  <Space>
                    <b>{n.order}.</b>
                    <span>{n.label}</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {n.role}
                    </Tag>
                  </Space>
                ),
                description:
                  n.key === box.status ? (
                    <span style={{ color: n.color, fontWeight: 600 }}>● 当前节点</span>
                  ) : null,
                status:
                  box.status === n.key
                    ? 'process'
                    : FLOW_NODE_DEFINITIONS.findIndex((f) => f.key === box.status) >
                      FLOW_NODE_DEFINITIONS.findIndex((f) => f.key === n.key)
                    ? 'finish'
                    : 'wait',
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <RocketOutlined />
                关联航班
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {relatedFlight ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="航班号">
                  <b>{relatedFlight.flightNo}</b>
                </Descriptions.Item>
                <Descriptions.Item label="航空公司">{relatedFlight.airline || '-'}</Descriptions.Item>
                <Descriptions.Item label="航线">
                  {relatedFlight.departureCode} → {relatedFlight.arrivalCode}
                </Descriptions.Item>
                <Descriptions.Item label="计划起飞">
                  {formatDate(relatedFlight.scheduledDeparture)}
                </Descriptions.Item>
                <Descriptions.Item label="计划到达">
                  {formatDate(relatedFlight.scheduledArrival)}
                </Descriptions.Item>
                <Descriptions.Item label="实际起飞">
                  {formatDate(relatedFlight.actualDeparture)}
                </Descriptions.Item>
                <Descriptions.Item label="延误">
                  {relatedFlight.delayMinutes
                    ? `${relatedFlight.delayMinutes} 分钟`
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="暂无关联航班" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined />
                单证清单
                <Tag color="red">{documentGaps.length} 缺口</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={docColumns}
              dataSource={box.documents || []}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title={
              <Space>
                <LinkOutlined />
                盒号/样本号/伦理批件 对应关系（共 {sampleTubes.length} 管）
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={tubeColumns}
              dataSource={sampleTubes}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: true }}
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ThermometerOutlined />
                温度记录
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={tempColumns}
              dataSource={temperatureRecords}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined />
                温度复核与冻结
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Divider orientation="left" style={{ marginTop: 0 }}>
              复核记录
            </Divider>
            <List
              size="small"
              dataSource={temperatureReviews}
              locale={{ emptyText: '暂无复核记录' }}
              renderItem={(item: any) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag
                          color={
                            TemperatureReviewConclusionColors[
                              item.conclusion as keyof typeof TemperatureReviewConclusionColors
                            ] || 'default'
                          }
                        >
                          {TemperatureReviewConclusionLabels[
                            item.conclusion as keyof typeof TemperatureReviewConclusionLabels
                          ] || item.conclusion}
                        </Tag>
                        <span>{formatDate(item.reviewAt)}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {item.exceededDurationMinutes && (
                          <span>超限时长：{item.exceededDurationMinutes} 分钟</span>
                        )}
                        {item.conclusionDetail || '-'}
                        <span style={{ color: '#888', fontSize: 12 }}>
                          操作人：{item.reviewerName || '-'}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <Divider orientation="left">冻结记录</Divider>
            <List
              size="small"
              dataSource={freezeRecords}
              locale={{ emptyText: '暂无冻结记录' }}
              renderItem={(item: any) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="red">
                          {item.freezeType === 'manual' ? '手动冻结' : '自动冻结'}
                        </Tag>
                        <span>{formatDate(item.initiatedAt)}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <span>原因：{item.freezeReason || '-'}</span>
                        {item.abnormalConclusion && (
                          <Alert
                            type="info"
                            showIcon
                            size="small"
                            style={{ marginTop: 4 }}
                            message={`异常结论：${item.abnormalConclusion}`}
                            description={
                              <span style={{ fontSize: 12, color: '#666' }}>
                                {formatDate(item.abnormalConclusionAt)} ·{' '}
                                {item.abnormalConclusionByName || ''}
                              </span>
                            }
                          />
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                流转日志
              </Space>
            }
          >
            <Timeline
              items={flowLogs.map((log: any) => ({
                color: log.toStatus === 'FROZEN' || log.toStatus === 'DESTROYED' ? 'red' : 'blue',
                children: (
                  <div style={{ padding: '4px 0' }}>
                    <Space wrap>
                      <b>{log.actionType}</b>
                      <Tag>{log.fromStatus || '-'}</Tag>
                      <span>→</span>
                      <Tag color="blue">{log.toStatus}</Tag>
                    </Space>
                    <div style={{ marginTop: 4, color: '#666' }}>
                      <span style={{ marginRight: 16 }}>{formatDate(log.operatedAt)}</span>
                      <span style={{ marginRight: 16 }}>操作人：{log.operatorName || '-'}</span>
                      {log.remark && <span>备注：{log.remark}</span>}
                    </div>
                  </div>
                ),
              }))}
            />
            {flowLogs.length === 0 && (
              <Empty description="暂无流转日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomsBoxDetail;
