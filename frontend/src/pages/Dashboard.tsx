import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Badge } from 'antd';
import {
  BoxPlotOutlined,
  WarningOutlined,
  SafetyOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { SampleBoxStatusLabels, SampleBoxStatusColors, formatDate } from '../utils/constants';
import { useAuthStore } from '../store/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statistics, setStatistics] = useState<any>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, todosRes, nodesRes] = await Promise.all([
        api.get('/dashboard/statistics'),
        api.get('/dashboard/todos'),
        api.get('/dashboard/flow-nodes'),
      ]);
      setStatistics(statsRes.data);
      setTodos(todosRes.data || []);
      setFlowNodes(nodesRes.data || []);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTodoItems = (todo: any) => {
    return (
      <List.Item
        key={todo.type}
        style={{ padding: '12px 0', border: 0 }}
      >
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div>
              <Badge
                count={todo.count}
                size="small"
                offset={[6, 0]}
                showZero
              >
                <span style={{ fontWeight: 500, fontSize: 14 }}>{todo.title}</span>
              </Badge>
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => {
                if (todo.type === 'approval') navigate('/approvals');
                else navigate('/sample-boxes');
              }}
            >
              查看 <ArrowRightOutlined />
            </Button>
          </div>
          {(todo.items || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(todo.items || []).slice(0, 5).map((item: any) => (
                <Tag
                  key={item.id}
                  color={SampleBoxStatusColors[item.status as keyof typeof SampleBoxStatusColors] || 'default'}
                  style={{
                    margin: 0,
                    padding: '2px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/sample-boxes/${item.id}`)}
                >
                  {item.boxCode}
                </Tag>
              ))}
              {(todo.items || []).length > 5 && (
                <span style={{ fontSize: 12, color: '#999', padding: '2px 0' }}>
                  等{todo.items.length}条...
                </span>
              )}
            </div>
          )}
        </div>
      </List.Item>
    );
  };

  const currentStatusCount = statistics?.statusCounts?.find(
    (s: any) => s.status === flowNodes.find((n) => n.order === 8)?.key
  )?.count || 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          欢迎回来，{user?.name}（{user?.orgName}）
        </h2>
        <p style={{ color: '#666', marginTop: 4 }}>
          {formatDate(new Date())} · 今日待办共 {todos.reduce((sum, t) => sum + (t.count || 0), 0)} 项
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="样本盒总数"
              value={statistics?.summary?.total || 0}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="待出境审批"
              value={statistics?.summary?.pendingExport || 0}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="已冻结样本盒"
              value={statistics?.summary?.frozen || 0}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="温度异常"
              value={statistics?.summary?.abnormal || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SafetyCertificateOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <span style={{ fontWeight: 600 }}>样本流转节点分布</span>
              </div>
            }
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px 8px',
                gap: 4,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {flowNodes
                .sort((a, b) => a.order - b.order)
                .map((node, index) => {
                  const count =
                    statistics?.statusCounts?.find((s: any) => s.status === node.key)?.count || 0;
                  return (
                    <>
                      <div
                        key={node.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '8px 12px',
                          minWidth: 110,
                          background: count > 0 ? node.color + '15' : '#fafafa',
                          borderRadius: 8,
                          border: `1px solid ${count > 0 ? node.color + '40' : '#eee'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => navigate('/sample-boxes')}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: node.color,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 16,
                            marginBottom: 8,
                          }}
                        >
                          {count}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#333',
                            marginBottom: 4,
                          }}
                        >
                          {node.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>{node.role}</div>
                      </div>
                      {index < flowNodes.length - 1 && (
                        <div
                          style={{
                            color: '#d9d9d9',
                            fontSize: 18,
                            padding: '0 2px',
                            marginTop: -20,
                          }}
                        >
                          →
                        </div>
                      )}
                    </>
                  );
                })}
            </div>
          </Card>

          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span style={{ fontWeight: 600 }}>待办事项</span>
              </div>
            }
            loading={loading}
          >
            <List
              dataSource={todos}
              locale={{ emptyText: '暂无待办事项，太棒了！' }}
              renderItem={renderTodoItems}
              split
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <span style={{ fontWeight: 600 }}>伦理批件待完善</span>
              </div>
            }
            loading={loading}
            style={{ height: '100%' }}
          >
            <Statistic
              title="待核验数"
              value={statistics?.summary?.pendingEthics || 0}
              valueStyle={{ color: '#faad14', fontSize: 40 }}
              style={{ textAlign: 'center', padding: '16px 0' }}
            />
            <div
              style={{
                padding: 16,
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 8,
                marginTop: 8,
                fontSize: 13,
                color: '#613400',
                lineHeight: 1.8,
              }}
            >
              ⚠️ 请务必确认：
              <br />
              1. 伦理批件编号已录入
              <br />
              2. 批件文件已上传
              <br />
              3. 批件在有效期内
              <br />
              <span style={{ color: '#cf1322', fontWeight: 500 }}>
                ⛔ 缺失或过期将无法出境！
              </span>
            </div>
            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              onClick={() => navigate('/documents')}
            >
              去完善单证
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
