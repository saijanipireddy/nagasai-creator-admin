import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Sidebar />
      <main className="ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
