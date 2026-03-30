import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import projectsData from '../../data/projects.json';
import { Database, Loader2, CheckCircle2, Box } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const Dashboard = () => {
    const [stats, setStats] = useState({ projects: 0, loading: true });
    const [importing, setImporting] = useState(false);
    const [importDone, setImportDone] = useState(false);
    
    // Store
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setShowStudioEditor = useAppStore(s => s.setShowStudioEditor);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });
        
        if (!error) setStats({ projects: count, loading: false });
    };

    const handleImport = async () => {
        if (!window.confirm('Это импортирует все проекты из файла projects.json в базу данных. Продолжить?')) return;
        
        setImporting(true);
        const projectsToInsert = projectsData.map(p => ({
            title: p.title,
            tags: p.tags,
            cover: p.cover,
            video_url: p.videoUrl,
            short_description: p.short,
            challenge: p.challenge,
            solution: p.solution,
            result: p.result,
            tech: p.tech
        }));

        const { error } = await supabase.from('projects').insert(projectsToInsert);
        
        if (error) {
            alert('Ошибка импорта: ' + error.message);
        } else {
            setImportDone(true);
            fetchStats();
        }
        setImporting(false);
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
                    <p className="text-4xl font-light mb-2">{stats.loading ? '...' : stats.projects}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-light">Активные кейсы</p>
                </div>
                {/* Other stats... */}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
                <h3 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-8 px-2">Утилиты</h3>
                
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                            <Database size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white mb-1">Миграция данных</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Перенести проекты из projects.json в базу данных</p>
                        </div>
                    </div>
                    
                    {importDone ? (
                        <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest font-medium">
                            <CheckCircle2 size={16} />
                            Готово
                        </div>
                    ) : (
                        <button 
                            onClick={handleImport}
                            disabled={importing}
                            className="bg-white text-black px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {importing ? <Loader2 size={14} className="animate-spin" /> : null}
                            {importing ? 'Импорт...' : 'Начать импорт'}
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/5 mt-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                            <Box size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white mb-1">Студия Скульптуры</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Включить визуальный редактор положения 3D модели</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowStudioEditor(!showStudioEditor)}
                        className={`${showStudioEditor ? 'bg-amber-500 text-white' : 'bg-white text-black'} px-6 py-3 rounded-lg text-[10px] uppercase tracking-widest font-medium transition-all duration-300`}
                    >
                        {showStudioEditor ? 'ВЫКЛЮЧИТЬ РЕДАКТОР' : 'ВКЛЮЧИТЬ РЕДАКТОР'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;

