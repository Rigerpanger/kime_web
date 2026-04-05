import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { Save, Loader2, Check, Box, Palette, Camera, Lightbulb, Plus, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const FX_TYPES = ['None', 'NeuralCore', 'ShapeShifter', 'SoftwareSilhouette', 'TetrisReveal', 'Iris'];

const StudioEditor = () => {
    const { session } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    const config = useAppStore(s => s.sculptureConfig);
    const setConfig = useAppStore(s => s.setSculptureConfig);
    const activeSlug = useAppStore(s => s.activeSlug) || 'default';
    const setView = useAppStore(s => s.setView);
    const setActiveSlug = useAppStore(s => s.setActiveSlug);
    
    const setIsOverPanel = useAppStore(s => s.setIsOverPanel);
    
    // Clean up redundant manual listeners - we'll use isOverPanel + disabled OrbitControls instead
    useEffect(() => {
        return () => setIsOverPanel(false);
    }, []);
    
    const updateSectionFX = useAppStore(s => s.updateSectionFX);
    const updateSectionCamera = useAppStore(s => s.updateSectionCamera);
    const updateLight = useAppStore(s => s.updateLight);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('camera');
    const [activeSlot, setActiveSlot] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showAdvancedCam, setShowAdvancedCam] = useState(false);
    const [captured, setCaptured] = useState(false);
    
    const triggerCapture = useAppStore(s => s.triggerCapture);

    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
    const activeCam = currentSection?.camera || { azimuth: 0, polar: 90, radius: 18, pivotX: 0, pivotY: 12.5, pivotZ: 0 };

    const rawFX = currentSection?.fx?.[activeSlot] || {};
    const currentFX = {
        type: rawFX.type || 'None',
        pos: rawFX.pos || [0, 0, 0],
        scale: rawFX.scale || 1,
        color: rawFX.color || '#ffffff',
        intensity: rawFX.intensity || 1,
        active: rawFX.active || false
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!session?.token) throw new Error("Unauthorized");
            const response = await fetch(`${apiUrl}/content/sculpture_config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
                body: JSON.stringify(config)
            });
            if (response.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
        } catch (error) { alert('Error: ' + error.message); }
        finally { setSaving(false); }
    };

    const renderSlider = (label, value, min, max, step, onChange, format = (v) => v?.toFixed(2)) => (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] uppercase tracking-widest text-[#ffcc00]/50">
                <span>{label}</span>
                <span className="font-mono text-[#ffcc00]">{format(value)}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value ?? 0} 
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full accent-[#ffcc00] h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
            />
        </div>
    );

    const SECTION_NAMES = {
        "default": "Главная (Home)",
        "about": "О компании (About)",
        "services": "Услуги (Services)",
        "projects": "Проекты (Projects)",
        "contact": "Контакты (Contact)",
        "about-slide-0": "О компании: Слайд 1 (О Студии)",
        "about-slide-1": "О компании: Слайд 2 (Наш подход)",
        "about-slide-2": "О компании: Слайд 3 (Лидерство)",
        "about-slide-3": "О компании: Слайд 4 (Нам доверяют)",
        "digital-graphics": "Служба: Digital Graphics",
        "ar-vr": "Служба: AR/VR",
        "software-dev": "Служба: Software Dev",
        "gamedev": "Служба: GameDev",
        "ai-ml": "Служба: AI / ML"
    };

    return (
        <div 
            onMouseEnter={() => setIsOverPanel(true)}
            onMouseLeave={() => setIsOverPanel(false)}
            className={`fixed bottom-0 left-0 w-full transition-all duration-500 ease-in-out bg-[#050505]/98 backdrop-blur-3xl border-t border-[#ffcc00]/20 z-[9999] flex text-white font-sans shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${isCollapsed ? 'h-[32px]' : 'h-[165px]'}`}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                className="absolute top-[-26px] right-8 px-4 py-1.5 bg-[#ffcc00] text-black rounded-t-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all z-[10001] shadow-lg"
            >
                {isCollapsed ? <><ChevronUp size={12} /> Развернуть</> : <><ChevronDown size={12} /> Свернуть</>}
            </button>

            {isCollapsed ? (
                <div className="w-full h-full flex items-center px-6 gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ffcc00] animate-pulse" />
                        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-[#ffcc00]">Antigravity Studio</h3>
                    </div>
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                        Раздел: {SECTION_NAMES[activeSlug] || activeSlug}
                    </div>
                </div>
            ) : (
                <div className="flex w-full h-full overflow-hidden">
                    <div className="w-[100px] shrink-0 border-r border-white/5 p-2 flex flex-col justify-between bg-black/20">
                        <div className="space-y-1.5">
                            {[
                                { id: 'camera', icon: Camera, label: 'Cam' },
                                { id: 'fx', icon: Zap, label: 'FX' },
                                { id: 'light', icon: Lightbulb, label: 'Light' },
                                { id: 'mat', icon: Palette, label: 'Mat' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-md transition-all ${activeTab === tab.id ? 'bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/20' : 'text-white/20 hover:bg-white/5'}`}
                                >
                                    <tab.icon size={10} />
                                    <span className="text-[7.5px] font-bold uppercase">{tab.label}</span>
                                </button>
                            ))}
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className={`w-full mt-1.5 py-1.5 rounded-md font-black uppercase text-[8px] transition-all flex items-center justify-center gap-1.5 shadow-lg ${saved ? 'bg-green-500 text-white' : 'bg-[#ffcc00] text-black hover:scale-[1.02] active:scale-95'}`}
                            >
                                {saving ? <Loader2 size={10} className="animate-spin" /> : saved ? <Check size={10} /> : <><Save size={10} /> Deploy</>}
                            </button>
                        </div>
                        <div className="text-[5px] text-white/20 uppercase tracking-[0.2em] text-center">ANTIGRAVITY</div>
                    </div>

                    {activeTab !== 'camera' && activeTab !== 'mat' && (
                        <div className="w-[160px] shrink-0 border-r border-white/5 p-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar bg-white/[0.01]">
                            <h4 className="text-[7px] uppercase font-bold tracking-widest text-white/30 mb-1">Список</h4>
                            {activeTab === 'light' && (
                                <>
                                    {(config.lights || []).map(l => (
                                        <button 
                                            key={l.id} 
                                            onClick={() => setActiveLightId(l.id)}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all flex justify-between items-center ${activeLightId === l.id ? 'bg-[#ffcc00] text-black' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                                        >
                                            {l.name}
                                            {activeLightId === l.id && <div className="w-1 h-1 bg-black rounded-full" />}
                                        </button>
                                    ))}
                                    <button onClick={addLight} className="w-full py-1.5 border border-dashed border-[#ffcc00]/20 text-[#ffcc00]/40 rounded-lg text-[8px] font-bold hover:bg-[#ffcc00]/10 transition-all">
                                        + Добавить
                                    </button>
                                </>
                            )}
                            {activeTab === 'fx' && [0,1,2,3,4].map(i => (
                                <button 
                                    key={i}
                                    onClick={() => setActiveSlot(i)}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all flex justify-between items-center ${activeSlot === i ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                                >
                                    Слот #{i+1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {activeTab === 'camera' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <h4 className="text-[9px] font-black uppercase text-[#ffcc00]">Редактор Камеры <span className="opacity-30 ml-2">// {SECTION_NAMES[activeSlug] || activeSlug}</span></h4>
                                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-[7px] font-black uppercase">Авто-захват OK</div>
                                </div>
                                <div className="grid grid-cols-3 gap-6 items-start">
                                    <div className="space-y-3">
                                        <h5 className="text-[7px] uppercase tracking-widest text-[#ffcc00]/40 font-bold">1. Настройте камеру</h5>
                                        <p className="text-[8px] text-white/30 leading-relaxed">Вращайте модель мышкой. Правой кнопкой — двигайте фокус. Колесиком — зум. Когда ракурс идеален — нажмите кнопку ниже:</p>
                                        <button 
                                            onClick={() => {
                                                triggerCapture();
                                                setCaptured(true);
                                                setTimeout(() => setCaptured(false), 1500);
                                            }}
                                            className={`w-full py-3 rounded-lg font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,204,0,0.2)] border-2 ${captured ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#ffcc00] border-[#ffcc00] text-black hover:scale-[1.02] active:scale-95'}`}
                                        >
                                            {captured ? <Check size={14} /> : <><Camera size={14} /> ЗАПОМНИТЬ ЭТОТ ВИД</>}
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h5 className="text-[7px] uppercase tracking-widest text-[#ffcc00]/40 font-bold">2. Высота модели</h5>
                                        {renderSlider('Section Y (Local)', currentSection?.modelY ?? 5.1, -30, 40, 0.1, (v) => updateSectionCamera(activeSlug, { modelY: v }))}
                                        {renderSlider('Master Y (Global)', config.y, -30, 40, 0.1, (v) => setConfig({ y: v }))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h5 className="text-[7px] uppercase tracking-widest text-indigo-400/40 font-bold">3. Дополнительно</h5>
                                            <button 
                                                onClick={() => setShowAdvancedCam(!showAdvancedCam)}
                                                className="text-[7px] uppercase font-bold text-white/30 hover:text-white"
                                            >
                                                {showAdvancedCam ? 'Скрыть' : 'Настройки ↑'}
                                            </button>
                                        </div>
                                        
                                        {showAdvancedCam ? (
                                            <div className="space-y-2.5 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                                                {renderSlider('FOV / Zoom', activeCam.radius, 1, 90, 0.5, (v) => updateSectionCamera(activeSlug, { radius: v }))}
                                                {renderSlider('Horizontal Spin', config.rotationY, 0, 360, 1, (v) => setConfig({ rotationY: v }))}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {renderSlider('PX', activeCam.pivotX, -40, 40, 0.1, (v) => updateSectionCamera(activeSlug, { pivotX: v }))}
                                                    {renderSlider('PY', activeCam.pivotY, -15, 60, 0.1, (v) => updateSectionCamera(activeSlug, { pivotY: v }))}
                                                    {renderSlider('PZ', activeCam.pivotZ, -40, 40, 0.1, (v) => updateSectionCamera(activeSlug, { pivotZ: v }))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <button 
                                                    onClick={() => {
                                                        updateSectionCamera(activeSlug, { 
                                                            pivotX: 0, pivotY: 5.1, pivotZ: 0, 
                                                            radius: 18, polar: 90, azimuth: 0,
                                                            modelY: 5.1
                                                        });
                                                        setConfig({ y: 5.1, scale: 17 });
                                                    }}
                                                    className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-[7px] font-black uppercase hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <Zap size={10} /> СБРОСИТЬ (RECOVER)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'light' && (config.lights || []).find(l => l.id === activeLightId) && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                        <h5 className="text-[9px] uppercase font-black text-[#ffcc00]">{activeLightId}</h5>
                                        <button onClick={() => removeLight(activeLightId)} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={11}/></button>
                                    </div>
                                    {renderSlider('Intensity', (config.lights || []).find(l => l.id === activeLightId).intensity, 0, 150, 1, (v) => updateLight(activeLightId, { intensity: v }))}
                                    {renderSlider('Radius', (config.lights || []).find(l => l.id === activeLightId).radius, 0, 50, 0.1, (v) => updateLight(activeLightId, { radius: v }))}
                                </div>
                                <div className="space-y-4 pt-5">
                                    {renderSlider('Azimuth', (config.lights || []).find(l => l.id === activeLightId).azimuth, 0, 360, 1, (v) => updateLight(activeLightId, { azimuth: v }), v => `${v}°`)}
                                    {renderSlider('Y Height', (config.lights || []).find(l => l.id === activeLightId).y, -20, 50, 0.1, (v) => updateLight(activeLightId, { y: v }))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'fx' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                        <select value={currentFX.type} onChange={e => updateSectionFX(activeSlug, activeSlot, { type: e.target.value })} className="bg-transparent text-[9px] uppercase font-black text-[#ffcc00] outline-none cursor-pointer">
                                            {FX_TYPES.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                                        </select>
                                        <input type="checkbox" checked={currentFX.active} onChange={e => updateSectionFX(activeSlug, activeSlot, { active: e.target.checked })} className="w-3 h-3 accent-emerald-500" />
                                    </div>
                                    {renderSlider('Scale', currentFX.scale, 0.1, 8.0, 0.1, (v) => updateSectionFX(activeSlug, activeSlot, { scale: v }))}
                                    {renderSlider('Power', currentFX.intensity, 0, 2, 0.05, (v) => updateSectionFX(activeSlug, activeSlot, { intensity: v }))}
                                </div>
                                <div className="space-y-4 pt-1">
                                    <div className="grid grid-cols-3 gap-2">
                                        {['X','Y','Z'].map((axis, i) => (
                                            <div key={axis} className="space-y-1">
                                                <div className="text-[7px] text-white/20 uppercase">{axis}</div>
                                                <input type="number" value={currentFX.pos[i]} step={0.1} onChange={e => { const newPos = [...currentFX.pos]; newPos[i] = parseFloat(e.target.value); updateSectionFX(activeSlug, activeSlot, { pos: newPos }); }} className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 text-[9px] font-mono text-[#ffcc00] outline-none" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="color" value={currentFX.color} onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })} className="h-7 w-10 bg-transparent cursor-pointer rounded border border-white/10" />
                                        <input type="text" value={currentFX.color} onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-md p-1.5 text-[8px] font-mono text-[#ffcc00] uppercase text-center" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'mat' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[7px] uppercase tracking-widest text-[#ffcc00]/30 border-b border-white/5 pb-1 font-bold">Глобальное положение</h5>
                                    {renderSlider('Global Y', config.y, -18, 25, 0.1, (v) => setConfig({ y: v }))}
                                    {renderSlider('Global Scale', config.scale, 1, 250, 1, (v) => setConfig({ scale: v }))}
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[7px] uppercase tracking-widest text-[#ffcc00]/30 border-b border-white/5 pb-1 font-bold">Материал</h5>
                                    {renderSlider('Roughness', config.roughness, 0, 1, 0.01, (v) => setConfig({ roughness: v }))}
                                    {renderSlider('Metalness', config.metalness, 0, 1, 0.01, (v) => setConfig({ metalness: v }))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudioEditor;
