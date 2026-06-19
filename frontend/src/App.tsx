import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SampleBoxList from './pages/sampleBox/List';
import SampleBoxDetail from './pages/sampleBox/Detail';
import DocumentList from './pages/document/List';
import FlightList from './pages/flight/List';
import FlightDetail from './pages/flight/Detail';
import TemperatureList from './pages/temperature/List';
import FreezeList from './pages/freeze/List';
import ApprovalList from './pages/approval/List';
import { UserRole } from './utils/enums';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const getMenuByRole = (role: string) => {
    const baseMenu = [
      { key: 'dashboard', icon: 'dashboard', label: '工作台', path: '/dashboard' },
    ];

    if (role === UserRole.RESEARCH_CENTER || role === UserRole.ADMIN) {
      baseMenu.push({ key: 'sampleBox', icon: 'box', label: '样本盒管理', path: '/sample-boxes' });
      baseMenu.push({ key: 'document-research', icon: 'file', label: '我的单证', path: '/documents' });
    }

    if (role === UserRole.CUSTOMS_OFFICER || role === UserRole.ADMIN) {
      baseMenu.push({ key: 'document', icon: 'file', label: '单证管理', path: '/documents' });
      baseMenu.push({ key: 'flight', icon: 'plane', label: '航班管理', path: '/flights' });
      baseMenu.push({ key: 'sampleBox-customs', icon: 'box', label: '样本盒出境', path: '/sample-boxes' });
    }

    if (role === UserRole.CENTRAL_LAB || role === UserRole.ADMIN) {
      baseMenu.push({ key: 'sampleBox-lab', icon: 'box', label: '样本盒接收', path: '/sample-boxes' });
      baseMenu.push({ key: 'temperature', icon: 'thermometer', label: '温度记录', path: '/temperature-records' });
      baseMenu.push({ key: 'freeze', icon: 'snowflake', label: '冻结处理', path: '/freeze-records' });
    }

    if (role === UserRole.ADMIN) {
      baseMenu.push({ key: 'approval', icon: 'check', label: '审批中心', path: '/approvals' });
    }

    return baseMenu;
  };

  const menuItems = user ? getMenuByRole(user.role) : [];

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <MainLayout menuItems={menuItems}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sample-boxes" element={<SampleBoxList />} />
              <Route path="/sample-boxes/:id" element={<SampleBoxDetail />} />
              <Route path="/documents" element={<DocumentList />} />
              <Route path="/flights" element={<FlightList />} />
              <Route path="/flights/:id" element={<FlightDetail />} />
              <Route path="/temperature-records" element={<TemperatureList />} />
              <Route path="/freeze-records" element={<FreezeList />} />
              <Route path="/approvals" element={<ApprovalList />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        }
      />
    </Routes>
  );
}

export default App;
