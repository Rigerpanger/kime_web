import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { 
    Monitor, 
    Smartphone, 
    Save, 
    Loader2, 
    ChevronUp, 
    ChevronDown, 
    Grid3X3,
    Layers,
    Type,
    FileText,
    Image as ImageIcon,
    Layout,
    ArrowUpCircle,
    ArrowDownCircle,
    MousePointer2
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Settings = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const session = useAuthStore(s => s.session);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'
    const [activeScreen, setActiveScreen] = useState('about_slide1');
    const [showGrid, setShowGrid] = useState(true);

    const [layoutSettings, setLayoutSettings] = useState({
        about_slide1_header_offset_desktop: 0, about_slide1_header_offset_mobile: 0,
        about_slide1_content_offset_desktop: 0, about_slide1_content_offset_mobile: 0,
        about_slide2_header_offset_desktop: 0, about_slide2_header_offset_mobile: 0,
        about_slide2_content_offset_desktop: 0, about_slide2_content_offset_mobile: 0,
        about_slide3_header_offset_desktop: 0, about_slide3_header_offset_mobile: 0,
        about_slide3_content_offset_desktop: 0, about_slide3_content_offset_mobile: 0,
        about_slide4_header_offset_desktop: 0, about_slide4_header_offset_mobile: 0,
        about_slide4_content_offset_desktop: 0, about_slide4_content_offset_mobile: 0,
        logoOffsetDesktop: 48, logoOffsetMobile: 32,
        services_header_offset_desktop: 0, services_header_offset_mobile: 0,
        services_content_offset_desktop: 0, services_content_offset_mobile: 0,
        projects_header_offset_desktop: 0, projects_header_offset_mobile: 0,
        projects_content_offset_desktop: 0, projects_content_offset_mobile: 0,
        projects_mobile_info_plate_offset: 0,
        contact_header_offset_desktop: 0, contact_header_offset_mobile: 0,
        contact_content_offset_desktop: 0, contact_content_offset_mobile: 0
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/content/global_layout`);
            if (res.ok) {
                const data = await res.json();
                setLayoutSettings(prev => ({ ...prev, ...data }));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`${apiUrl}/content/global_layout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.token}`
                },
                body: JSON.stringify(layoutSettings)
            });
            alert('Настройки композиции успешно сохранены!');
        } catch (e) { alert('Ошибка сохранения'); }
        finally { setSaving(false); }
    };

    const updateVal = (key, delta) => {
        setLayoutSettings(prev => ({
            ...prev,
            [key]: (prev[key] || 0) + delta
        }));
    };

    const screens = [
        { id: 'about_slide1', label: 'О НАС: СЛАЙД 1', group: 'О НАС' },
        { id: 'about_slide2', label: 'О НАС: СЛАЙД 2', group: 'О НАС' },
        { id: 'about_slide3', label: 'О НАС: СЛАЙД 3', group: 'О НАС' },
        { id: 'about_slide4', label: 'О НАС: СЛАЙД 4', group: 'О НАС' },
        { id: 'services', label: 'НАПРАВЛЕНИЯ', group: 'РАЗДЕЛЫ' },
        { id: 'projects', label: 'ПРАКТИКА', group: 'РАЗДЕЛЫ' },
        { id: 'contact', label: 'ОБСУДИТЬ', group: 'РАЗДЕЛЫ' }
    ];

    // Helper components
    const [dragState, setDragState] = useState(null); // { key, startY, startVal }
    const [selectedKey, setSelectedKey] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragState) return;
            const deltaY = e.clientY - dragState.startY;
            
            // Match the scales used in VisualMockup
            const dynamicScale = deviceMode === 'mobile' ? 2.6 : 2.15;
            const offsetDelta = Math.round(deltaY * dynamicScale);
            const newValue = dragState.startVal + offsetDelta;
            
            setLayoutSettings(prev => ({
                ...prev,
                [dragState.key]: newValue
            }));
        };

        const handleMouseUp = () => {
            setDragState(null);
        };

        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState]);

    const VisualMockup = () => {
        const isMobile = deviceMode === 'mobile';
        const hKey = `${activeScreen}_header_offset_${deviceMode}`;
        const cKey = `${activeScreen}_content_offset_${deviceMode}`;
        const isAboutS1 = activeScreen === 'about_slide1';
        const logoKey = isMobile ? 'logoOffsetMobile' : 'logoOffsetDesktop';

        // Recalibrated scale factors: Match physical screen vs mockup pixels
        const scale = isMobile ? 2.6 : 2.15;

        const hOff = (layoutSettings[hKey] || 0) / scale;
        const cOff = (layoutSettings[cKey] || 0) / scale;
        const lOff = (layoutSettings[logoKey] || 0) / scale;

        return (
            <div className={`relative transition-all duration-700 bg-[#0a0a0a] rounded-[2.5rem] border-[8px] border-[#1a1a1a] shadow-2xl flex flex-col items-center overflow-hidden
                ${isMobile ? 'w-[280px] h-[600px]' : 'w-full aspect-video max-w-4xl'}
            `}>
                {deviceMode === 'mobile' && <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/10 rounded-full" />}
                
                {showGrid && (
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                        style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)' }} 
                    />
                )}

                <div className="w-full h-full p-4 flex flex-col justify-center items-center relative">
                    {/* Viewport Center Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 border-t border-dashed border-white/10 pointer-events-none" />
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-[8px] font-bold text-white/10 uppercase tracking-widest pointer-events-none">Center</div>

                    <MockupBlock 
                        y={hOff} 
                        label="ЗАГОЛОВОК" 
                        icon={<Type size={14} />} 
                        color="indigo"
                        itemKey={hKey}
                        isSelected={selectedKey === hKey}
                        onSelect={() => setSelectedKey(hKey)}
                        onDragStart={(e) => setDragState({ key: hKey, startY: e.clientY, startVal: layoutSettings[hKey] || 0 })}
                    />

                    {/* Realistic spacing mimicking site defaults */}
                    <div className="h-6 pointer-events-none" />

                    <MockupBlock 
                        y={cOff} 
                        label="ОСНОВНОЙ КОНТЕНТ" 
                        icon={<FileText size={14} />}
                        color="amber"
                        // Realistic content height mapping
                        className={
                            activeScreen.startsWith('about') ? 'min-h-[100px]' : 
                            activeScreen === 'services' ? 'min-h-[220px]' : 
                            activeScreen === 'projects' ? 'min-h-[300px]' : 
                            'min-h-[150px]'
                        }
                        itemKey={cKey}
                        isSelected={selectedKey === cKey}
                        onSelect={() => setSelectedKey(cKey)}
                        onDragStart={(e) => setDragState({ key: cKey, startY: e.clientY, startVal: layoutSettings[cKey] || 0 })}
                    />

                    {isAboutS1 && (
                        <MockupBlock 
                            y={lOff} 
                            label="ЛОГОТИПЫ ПАРТНЕРОВ" 
                            icon={<ImageIcon size={14} />}
                            color="emerald"
                            className="mt-6"
                            itemKey={logoKey}
                            isSelected={selectedKey === logoKey}
                            onSelect={() => setSelectedKey(logoKey)}
                            onDragStart={(e) => setDragState({ key: logoKey, startY: e.clientY, startVal: layoutSettings[logoKey] || 0 })}
                        />
                    )}
                </div>
            </div>
        );
    };

    const MockupBlock = ({ y, label, icon, color, className = "", isSelected, onSelect, onDragStart }) => {
        const colorClasses = {
            indigo: "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]",
            amber: "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
            emerald: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
            rose: "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
        };
        
        const colors = colorClasses[color] || colorClasses.indigo;

        return (
            <div 
                className={`w-full flex flex-col transition-all duration-300 relative z-20 cursor-ns-resize group ${className}`}
                style={{ transform: `translateY(${y}px)` }}
                onMouseDown={(e) => {
                    onSelect();
                    onDragStart(e);
                }}
            >
                <div className={`flex items-center gap-2 p-4 rounded-2xl border backdrop-blur-md transition-all
                    ${colors} 
                    ${isSelected ? 'ring-2 ring-white ring-offset-4 ring-offset-black scale-[1.02]' : 'hover:scale-[1.01] hover:bg-white/5'}
                `}>
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                </div>
            </div>
        );
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <span className="text-[10px] uppercase tracking-[0.5em] text-white/20">Анализ композиции...</span>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col h-full bg-[#080808] text-white overflow-hidden -m-8">
                {/* Top Control Bar */}
                <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-thin tracking-[0.3em] uppercase">Composition <span className="text-indigo-500 font-normal">Center</span></h2>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                            <button onClick={() => setDeviceMode('desktop')} className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${deviceMode === 'desktop' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}>
                                <Monitor size={14} /> Desktop
                            </button>
                            <button onClick={() => setDeviceMode('mobile')} className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${deviceMode === 'mobile' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}>
                                <Smartphone size={14} /> Mobile
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowGrid(!showGrid)} className={`p-2.5 rounded-xl border transition-all ${showGrid ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-white/20'}`}>
                            <Grid3X3 size={20} />
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-indigo-500 hover:bg-indigo-600 px-8 py-3 rounded-xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Navigation */}
                    <div className="w-[300px] border-r border-white/5 bg-black/20 overflow-y-auto no-scrollbar p-6 space-y-8">
                        {['О НАС', 'РАЗДЕЛЫ'].map(group => (
                            <div key={group} className="space-y-3">
                                <h3 className="text-[10px] font-black text-white/20 tracking-[0.4em] px-4 uppercase">{group}</h3>
                                <div className="space-y-1">
                                    {screens.filter(s => s.group === group).map(screen => (
                                        <button 
                                            key={screen.id}
                                            onClick={() => setActiveScreen(screen.id)}
                                            className={`w-full text-left px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border
                                                ${activeScreen === screen.id 
                                                    ? 'bg-white/5 border-white/10 text-indigo-400' 
                                                    : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            {screen.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 flex flex-col p-10 overflow-y-auto no-scrollbar bg-[#0a0a0a]">
                        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                            
                            {/* Visual Representation Area */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-medium uppercase tracking-widest text-white/80">Визуальный макет</h4>
                                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Схема композиции экрана</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                                            <MousePointer2 size={12} /> Режим просмотра
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-black/40 rounded-[3rem] border border-white/5 p-8 flex items-center justify-center relative overflow-hidden">
                                     <VisualMockup />
                                </div>
                            </div>

                            {/* Control Panel Area */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-8">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <Layers className="text-indigo-400" size={20} />
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Параметры оффсетов</h4>
                                    </div>

                                    {/* Offset Controls */}
                                    <div className="space-y-10">
                                        <ControlRow 
                                            label="Заголовок" 
                                            currentKey={`${activeScreen}_header_offset_${deviceMode}`}
                                            value={layoutSettings[`${activeScreen}_header_offset_${deviceMode}`]}
                                            updateFn={updateVal}
                                            color="indigo"
                                            isSelected={selectedKey === `${activeScreen}_header_offset_${deviceMode}`}
                                        />
                                        <ControlRow 
                                            label="Основной контент" 
                                            currentKey={`${activeScreen}_content_offset_${deviceMode}`}
                                            value={layoutSettings[`${activeScreen}_content_offset_${deviceMode}`]}
                                            updateFn={updateVal}
                                            color="amber"
                                            isSelected={selectedKey === `${activeScreen}_content_offset_${deviceMode}`}
                                        />
                                        {activeScreen === 'about_slide1' && (
                                            <ControlRow 
                                                label="Отступ логотипов" 
                                                currentKey={deviceMode === 'desktop' ? 'logoOffsetDesktop' : 'logoOffsetMobile'}
                                                value={layoutSettings[deviceMode === 'desktop' ? 'logoOffsetDesktop' : 'logoOffsetMobile']}
                                                updateFn={updateVal}
                                                color="emerald"
                                                isSelected={selectedKey === (deviceMode === 'desktop' ? 'logoOffsetDesktop' : 'logoOffsetMobile')}
                                            />
                                        )}
                                        {activeScreen === 'projects' && deviceMode === 'mobile' && (
                                            <ControlRow 
                                                label="Нижняя плашка" 
                                                currentKey="projects_mobile_info_plate_offset"
                                                value={layoutSettings.projects_mobile_info_plate_offset}
                                                updateFn={updateVal}
                                                color="rose"
                                                isSelected={selectedKey === 'projects_mobile_info_plate_offset'}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Helper Info Card */}
                                <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                                    <p className="text-[11px] text-indigo-400/80 font-light leading-relaxed">
                                        Используйте кнопки <span className="font-bold underline">↑ ↓</span> для точной настройки с шагом 5px. Отрицательные значения поднимают блок выше, положительные — опускают ниже.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

// Sub-component for Control Rows
const ControlRow = ({ label, currentKey, value = 0, updateFn, color, isSelected }) => (
    <div className={`space-y-4 p-4 rounded-2xl transition-all duration-300 border ${
        isSelected ? 'bg-white/[0.04] border-white/10 shadow-xl' : 'border-transparent opacity-60'
    }`}>
        <div className="flex justify-between items-center px-1">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isSelected ? `text-${color}-400` : 'text-white/20'}`}>{label}</span>
            <span className={`text-[11px] font-mono font-bold ${isSelected ? `text-${color}-400` : 'text-white/40'}`}>{value} px</span>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => updateFn(currentKey, -5)}
                className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 p-3 rounded-xl flex items-center justify-center transition-all active:scale-95 text-white/40 hover:text-white"
            >
                <ArrowUpCircle size={20} />
            </button>
            <div className="w-px h-8 bg-white/5" />
            <button 
                onClick={() => updateFn(currentKey, 5)}
                className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 p-3 rounded-xl flex items-center justify-center transition-all active:scale-95 text-white/40 hover:text-white"
            >
                <ArrowDownCircle size={20} />
            </button>
        </div>
    </div>
);

export default Settings;
