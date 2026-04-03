import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import projectsData from '../../data/projects.json';
import { Database, Loader2, CheckCircle2, Box, Sliders, Save, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';

const Settings = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    const [importing, setImporting] = useState(false);
    const [importDone, setImportDone] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingLayout, setSavingLayout] = useState(false);
    
    // Store
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setShowStudioEditor = useAppStore(s => s.setShowStudioEditor);
    const session = useAuthStore(s => s.session);

    // Layout Settings State
    const [layoutSettings, setLayoutSettings] = useState({
        verticalOffsetDesktop: 0,
        verticalOffsetMobile: 0,
        logoOffsetDesktop: 48,
        logoOffsetMobile: 32
    });

    useEffect(() => {
        fetchAboutSettings();
    }, []);

    const fetchAboutSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/content/about_page`);
            if (res.ok) {
                const data = await res.json();
                setLayoutSettings({
                    verticalOffsetDesktop: data.verticalOffsetDesktop || 0,
                    verticalOffsetMobile: data.verticalOffsetMobile || 0,
                    logoOffsetDesktop: data.logoOffsetDesktop || 48,
                    logoOffsetMobile: data.logoOffsetMobile || 32
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLayout = async () => {
        setSavingLayout(true);
        try {
            // First get the current full content to avoid overwriting other fields
            const getRes = await fetch(`${apiUrl}/content/about_page`);
            const currentContent = getRes.ok ? await getRes.json() : {};
            
            const updatedContent = {
                ...currentContent,
                ...layoutSettings
            };

            const response = await fetch(`${apiUrl}/content/about_page`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}` 
                },
                body: JSON.stringify(updatedContent)
            });
            
            if (response.ok) alert('Настройки верстки сохранены!');
            else alert('Ошибка при сохранении');
        } catch (error) {
            alert('Ошибка сети');
        } finally {
            setSavingLayout(false);
        }
    };

    const handleImport = async () => {
        if (!window.confirm('Это импортирует все проекты из файла projects.json в базу данных вашего сервера. Продолжить?')) return;
        
        setImporting(true);
        try {
            for (const p of projectsData) {
                const projectBody = {
                    title: p.title,
                    slug: p.title.toLowerCase().replace(/\s+/g, '-'),
                    tags: p.tags || [],
                    cover: p.cover,
                    video_url: p.videoUrl,
                    short_description: p.short,
                    challenge: p.challenge,
                    solution: p.solution,
                    result: p.result,
                    tech: p.tech || [],
                    sort_order: 0
                };

                await fetch(`${apiUrl}/projects`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.token}`
                    },
                    body: JSON.stringify(projectBody)
                });
            }
            setImportDone(true);
        } catch (err) {
            console.error('Error during import:', err);
            alert('Ошибка импорта: ' + err.message);
        }
        setImporting(false);
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64 text-gray-500 uppercase tracking-widest text-xs animate-pulse">
                Загрузка настроек...
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-thin tracking-widest uppercase mb-2">Настройки</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Утилиты и конфигурация интерфейса</p>
                </div>
            </div>

            <div className="space-y-8 pb-20">
                {/* LAYOUT SETTINGS */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                                <Sliders size={20} />
                            </div>
                            <h3 className="text-sm font-light uppercase tracking-widest">Верстка: О студии</h3>
                        </div>
                        <button 
                            onClick={handleSaveLayout} 
                            disabled={savingLayout}
                            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {savingLayout ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {savingLayout ? 'Сохранение...' : 'Сохранить верстку'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/40">Вертикальное смещение (центровка)</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Десктоп (ПК)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={layoutSettings.verticalOffsetDesktop} 
                                        onChange={e => setLayoutSettings({...layoutSettings, verticalOffsetDesktop: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Мобильные</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={layoutSettings.verticalOffsetMobile} 
                                        onChange={e => setLayoutSettings({...layoutSettings, verticalOffsetMobile: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/40">Логотипы партнеров (Отступ)</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Десктоп (ПК)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={layoutSettings.logoOffsetDesktop} 
                                        onChange={e => setLayoutSettings({...layoutSettings, logoOffsetDesktop: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/20 ml-1">Мобильные</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none" 
                                        value={layoutSettings.logoOffsetMobile} 
                                        onChange={e => setLayoutSettings({...layoutSettings, logoOffsetMobile: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
                        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-400/80 leading-relaxed uppercase tracking-widest">
                            Мы внедрили умную адаптивность: "0" — это идеальный центр. <br/>
                            Используйте эти поля только для тонкой подстройки контента относительно 3D модели.
                        </p>
                    </div>
                </div>

                {/* SYSTEM UTILITIES */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                    <h3 className="text-sm font-light uppercase tracking-widest border-b border-white/5 pb-6">Утилиты системы</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Studio Toggle */}
                        <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                                    <Box size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">Студия Скульптуры</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Визуальный редактор 3D</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowStudioEditor(!showStudioEditor)}
                                className={`${showStudioEditor ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/40'} px-6 py-3 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all duration-300`}
                            >
                                {showStudioEditor ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}
                            </button>
                        </div>

                        {/* Migration */}
                        <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">Миграция (Legacy)</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Импорт из JSON</p>
                                </div>
                            </div>
                            
                            {importDone ? (
                                <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest font-bold px-4">
                                    <CheckCircle2 size={16} /> ГОТОВО
                                </div>
                            ) : (
                                <button 
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="bg-white/10 text-white/40 px-6 py-3 rounded-lg text-[9px] uppercase tracking-widest font-bold hover:bg-white/20 transition-all disabled:opacity-50"
                                >
                                    {importing ? '...' : 'ЗАПУСТИТЬ'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Settings;
