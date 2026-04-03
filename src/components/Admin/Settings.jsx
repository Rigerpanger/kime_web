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

    const [activeTab, setActiveTab] = useState('about'); // 'about' | 'sections' | 'utilities'
    // Layout Settings State
    const [layoutSettings, setLayoutSettings] = useState({
        // General About Sections
        about_header_offset_desktop: 0,
        about_header_offset_mobile: 0,
        about_content_offset_desktop: 0,
        about_content_offset_mobile: 0,
        // Individual About Slides
        about_slide1_header_offset_desktop: 0, about_slide1_header_offset_mobile: 0,
        about_slide1_content_offset_desktop: 0, about_slide1_content_offset_mobile: 0,
        about_slide2_header_offset_desktop: 0, about_slide2_header_offset_mobile: 0,
        about_slide2_content_offset_desktop: 0, about_slide2_content_offset_mobile: 0,
        about_slide3_header_offset_desktop: 0, about_slide3_header_offset_mobile: 0,
        about_slide3_content_offset_desktop: 0, about_slide3_content_offset_mobile: 0,
        about_slide4_header_offset_desktop: 0, about_slide4_header_offset_mobile: 0,
        about_slide4_content_offset_desktop: 0, about_slide4_content_offset_mobile: 0,
        // Logo Ticker
        logoOffsetDesktop: 48,
        logoOffsetMobile: 32,
        // Services
        services_header_offset_desktop: 0, services_header_offset_mobile: 0,
        services_content_offset_desktop: 0, services_content_offset_mobile: 0,
        // Projects
        projects_header_offset_desktop: 0, projects_header_offset_mobile: 0,
        projects_content_offset_desktop: 0, projects_content_offset_mobile: 0,
        // Contact
        contact_header_offset_desktop: 0, contact_header_offset_mobile: 0,
        contact_content_offset_desktop: 0, contact_content_offset_mobile: 0
    });

    useEffect(() => {
        fetchAboutSettings();
    }, []);

    const fetchAboutSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/content/global_layout`);
            if (res.ok) {
                const data = await res.json();
                setLayoutSettings(prev => ({
                    ...prev,
                    ...data
                }));
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
            const response = await fetch(`${apiUrl}/content/global_layout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}` 
                },
                body: JSON.stringify(layoutSettings)
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

            <div className="flex gap-4 mb-8 border-b border-white/5 pb-4">
                <button onClick={() => setActiveTab('about')} className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all ${activeTab === 'about' ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>О нас</button>
                <button onClick={() => setActiveTab('sections')} className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all ${activeTab === 'sections' ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>Разделы</button>
                <button onClick={() => setActiveTab('utilities')} className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all ${activeTab === 'utilities' ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>Система</button>
            </div>

            <div className="space-y-8 pb-20">
                {activeTab === 'about' && (
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Страница: О НАС</h3>
                            <button onClick={handleSaveLayout} disabled={savingLayout} className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-[9px] uppercase tracking-widest font-black hover:bg-indigo-600 transition-all disabled:opacity-50">
                                {savingLayout ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Сохранить
                            </button>
                        </div>
                        
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-white/40">Слайд {idx}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <OffsetControl 
                                        label="Заголовок (Header)" 
                                        onDesktopChange={val => setLayoutSettings({...layoutSettings, [`about_slide${idx}_header_offset_desktop`]: val})} 
                                        onMobileChange={val => setLayoutSettings({...layoutSettings, [`about_slide${idx}_header_offset_mobile`]: val})} 
                                        vDesktop={layoutSettings[`about_slide${idx}_header_offset_desktop`]}
                                        vMobile={layoutSettings[`about_slide${idx}_header_offset_mobile`]}
                                    />
                                    <OffsetControl 
                                        label="Контент (Content)" 
                                        onDesktopChange={val => setLayoutSettings({...layoutSettings, [`about_slide${idx}_content_offset_desktop`]: val})} 
                                        onMobileChange={val => setLayoutSettings({...layoutSettings, [`about_slide${idx}_content_offset_mobile`]: val})} 
                                        vDesktop={layoutSettings[`about_slide${idx}_content_offset_desktop`]}
                                        vMobile={layoutSettings[`about_slide${idx}_content_offset_mobile`]}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                             <OffsetControl 
                                label="Логотипы партнеров (Отступ)" 
                                onDesktopChange={val => setLayoutSettings({...layoutSettings, logoOffsetDesktop: val})} 
                                onMobileChange={val => setLayoutSettings({...layoutSettings, logoOffsetMobile: val})} 
                                vDesktop={layoutSettings.logoOffsetDesktop}
                                vMobile={layoutSettings.logoOffsetMobile}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Макеты Основных Разделов</h3>
                            <button onClick={handleSaveLayout} disabled={savingLayout} className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-[9px] uppercase tracking-widest font-black hover:bg-indigo-600 transition-all disabled:opacity-50">
                                {savingLayout ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Сохранить
                            </button>
                        </div>
                        
                        {/* Sections Controls */}
                        <div className="space-y-6">
                            <SectionTuner title="Направления (Services)" section="services" settings={layoutSettings} updateFn={setLayoutSettings} />
                            <SectionTuner title="Практика (Projects)" section="projects" settings={layoutSettings} updateFn={setLayoutSettings} />
                            <SectionTuner title="Обсудить (Contact)" section="contact" settings={layoutSettings} updateFn={setLayoutSettings} />
                        </div>
                    </div>
                )}

                {activeTab === 'utilities' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 space-y-8">
                            <h3 className="text-sm font-light uppercase tracking-widest border-b border-white/5 pb-6">Утилиты системы</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Studio Toggle */}
                                <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500"><Box size={24} /></div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Студия Скульптуры</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Визуальный редактор 3D</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowStudioEditor(!showStudioEditor)} className={`${showStudioEditor ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/40'} px-6 py-3 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all duration-300`}>
                                        {showStudioEditor ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}
                                    </button>
                                </div>

                                {/* Migration */}
                                <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500"><Database size={24} /></div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Миграция (Legacy)</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Импорт из JSON</p>
                                        </div>
                                    </div>
                                    {importDone ? (
                                        <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest font-bold px-4"><CheckCircle2 size={16} /> ГОТОВО</div>
                                    ) : (
                                        <button onClick={handleImport} disabled={importing} className="bg-white/10 text-white/40 px-6 py-3 rounded-lg text-[9px] uppercase tracking-widest font-bold hover:bg-white/20 transition-all disabled:opacity-50">
                                            {importing ? '...' : 'ЗАПУСТИТЬ'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

// Helper Components
const OffsetControl = ({ label, onDesktopChange, onMobileChange, vDesktop, vMobile }) => (
    <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">{label}</label>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-widest text-white/20">ПК</span>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs focus:border-indigo-500 outline-none" value={vDesktop} onChange={e => onDesktopChange(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-widest text-white/20">ТЕЛ</span>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs focus:border-indigo-500 outline-none" value={vMobile} onChange={e => onMobileChange(parseInt(e.target.value) || 0)} />
            </div>
        </div>
    </div>
);

const SectionTuner = ({ title, section, settings, updateFn }) => (
    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-white/40">{title}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <OffsetControl 
                label="Заголовок" 
                onDesktopChange={val => updateFn({...settings, [`${section}_header_offset_desktop`]: val})} 
                onMobileChange={val => updateFn({...settings, [`${section}_header_offset_mobile`]: val})} 
                vDesktop={settings[`${section}_header_offset_desktop`]}
                vMobile={settings[`${section}_header_offset_mobile`]}
            />
            <OffsetControl 
                label="Контент" 
                onDesktopChange={val => updateFn({...settings, [`${section}_content_offset_desktop`]: val})} 
                onMobileChange={val => updateFn({...settings, [`${section}_content_offset_mobile`]: val})} 
                vDesktop={settings[`${section}_content_offset_desktop`]}
                vMobile={settings[`${section}_content_offset_mobile`]}
            />
        </div>
    </div>
);

export default Settings;
