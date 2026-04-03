import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Info,
  Layers,
  Settings, 
  LogOut,
  ExternalLink 
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const AdminLayout = ({ children }) => {
    const signOut = useAuthStore(state => state.signOut);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Дашборд', path: '/admin' },
        { icon: Info, label: 'О студии', path: '/admin/about' },
        { icon: Briefcase, label: 'Проекты', path: '/admin/projects' },
        { icon: Settings, label: 'Настройки', path: '/admin/settings' },
    ];

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col pt-8">
                <div className="px-8 mb-12">
                    <h1 className="text-xl font-light tracking-[0.2em] uppercase text-white">
                        KIME Admin
                    </h1>
                </div>

                <nav className="flex-grow px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-widest transition-all
                                ${isActive 
                                    ? 'bg-white text-black font-medium' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 pb-8 space-y-2">
                    <button
                        onClick={() => window.open('/', '_blank')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all text-left"
                    >
                        <ExternalLink size={14} />
                        На сайт
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] uppercase tracking-widest text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all text-left"
                    >
                        <LogOut size={14} />
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto">
                <div className="p-12 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
