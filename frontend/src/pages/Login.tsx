import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import { UserRoleLabels } from '../store/auth';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginForm) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', values);
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        message.success(`欢迎回来，${res.data.user.name}（${UserRoleLabels[res.data.user.role] || ''}）`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#fff',
            }}
          >
            🧬
          </div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            跨境临床样本
          </Title>
          <Title level={4} style={{ margin: 0, color: '#666', fontWeight: 400 }}>
            出入境流转管理系统
          </Title>
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, borderRadius: 8, fontSize: 15 }}
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f6f8ff',
            borderRadius: 8,
            fontSize: 12,
            color: '#666',
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#333' }}>
            📋 测试账号
          </div>
          <div>研究中心：research1 / research123</div>
          <div>报关专员：customs1 / customs123</div>
          <div>中心实验室：lab1 / lab123</div>
          <div>系统管理员：admin / admin123</div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
