import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  BoxPlotOutlined,
  FileTextOutlined,
  RocketOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRoleLabels } from '../store/auth';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: string;
  label: string;
  path: string;
}

interface MainLayoutProps {
  menuItems: MenuItem[];
  children: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  box: <BoxPlotOutlined />,
  file: <FileTextOutlined />,
  plane: <RocketOutlined />,
  thermometer: <EnvironmentOutlined />,
  snowflake: <SafetyOutlined />,
  check: <CheckCircleOutlined />,
};

const MainLayout = ({ menuItems, children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.path))?.key || '';

  const userMenu = {
    items: [
      {
        key: 'user',
        icon: <UserOutlined />,
        label: `${user?.name}（${UserRoleLabels[user?.role || ''] || ''}）`,
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const items = menuItems.map((item) => ({
    key: item.key,
    icon: iconMap[item.icon],
    label: item.label,
    onClick: () => navigate(item.path),
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
        }}
        width={232}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 20 : 16,
            fontWeight: 600,
            borderBottom: '1px solid #000c17',
            background: '#000c17',
          }}
        >
          <span style={{ marginRight: collapsed ? 0 : 10, fontSize: 24 }}>🧬</span>
          {!collapsed && (
            <span style={{ letterSpacing: 0.5 }}>临床样本流转</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  style={{ background: '#1890ff', marginRight: 8 }}
                  icon={<UserOutlined />}
                  size={32}
                />
                <span style={{ color: '#333', fontWeight: 500 }}>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            minHeight: 'calc(100vh - 64px)',
            background: '#f0f2f5',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
