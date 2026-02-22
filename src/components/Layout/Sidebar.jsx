import { NavLink } from 'react-router-dom';
import { FaHome, FaBook, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, admin } = useAuth();

  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/courses', icon: FaBook, label: 'Courses' }
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-dark-sidebar border-r border-dark-secondary flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-secondary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dark-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Naga sai</h1>
            <p className="text-xs text-dark-muted">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4" aria-label="Admin navigation">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-dark-accent text-white'
                    : 'text-dark-muted hover:bg-dark-secondary hover:text-white'}
                `}
              >
                <item.icon className="text-lg" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-dark-secondary space-y-3">
        {admin && (
          <p className="text-xs text-dark-muted text-center truncate">{admin.email}</p>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          aria-label="Logout"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
