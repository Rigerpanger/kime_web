import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ projects: 0, loading: true });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${apiUrl}/projects`);
            if (response.ok) {
                const data = await response.json();
                setStats({ projects: data.length, loading: false });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setStats({ projects: 0, loading: false });
        }
    };

    return (
        <AdminLayout>
            <div className="mb-12">
                <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">Обзор</h2>
                <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Статистика вашего сайта</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Проекты</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-light">{stats.loading ? '...' : stats.projects}</p>
                        <LayoutDashboard size={16} className="text-gray-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-light mt-2">Активные кейсы</p>
                </div>
                
                <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Статус системы</p>
                    <p className="text-xl font-light text-green-500 uppercase tracking-widest">Онлайн</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-light mt-2">Сервер активен</p>
                </div>

                <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">База данных</p>
                    <p className="text-xl font-light text-blue-400 uppercase tracking-widest">PostgreSQL</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-light mt-2">Подключено</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
