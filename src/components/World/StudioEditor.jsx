import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { Save, Loader2, Check, Box, Palette, Camera, Lightbulb, Plus, Trash2, Zap } from 'lucide-react';

const FX_TYPES = ['None', 'NeuralCore', 'ShapeShifter', 'SoftwareSilhouette', 'TetrisReveal', 'Iris'];

const StudioEditor = () => {
    const { session } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    const config = useAppStore(s => s.sculptureConfig);
    const setConfig = useAppStore(s => s.setSculptureConfig);
    const activeSlug = useAppStore(s => s.activeSlug) || 'default';
    const setView = useAppStore(s => s.setView);
    const setActiveSlug = useAppStore(s => s.setActiveSlug);
    
    // Desktop Scroll Stop
    const panelRef = React.useRef(null);
    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;
        const stopScroll = (e) => e.stopPropagation();
        el.addEventListener('wheel', stopScroll, { passive: false });
        el.addEventListener('touchmove', stopScroll, { passive: false });
        return () => {
            el.removeEventListener('wheel', stopScroll);
            el.removeEventListener('touchmove', stopScroll);
        };
    }, []);
    
    // Actions
    const updateSectionCameraId = useAppStore(s => s.updateSectionCameraId);
    const updateSectionFX = useAppStore(s => s.updateSectionFX);
    const updateSectionCamera = useAppStore(s => s.updateSectionCamera);
    const updateLight = useAppStore(s => s.updateLight);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);

    const triggerCapture = useAppStore(s => s.triggerCapture);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('camera');
    const [activeSlot, setActiveSlot] = useState(0);

    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
    
    // Use the camera directly attached to the section (or fallback to defaults)
    const activeCam = currentSection?.camera || { azimuth: 0, polar: 90, radius: 18, pivotX: 0, pivotY: 5.1, pivotZ: 0 };

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

    const captureCamera = () => {
        triggerCapture();
    };

    const renderSlider = (label, value, min, max, step, onChange, format = (v) => v?.toFixed(2)) => (
        <div className="space-y-2">
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-[#ffcc00]/60">
                <span>{label}</span>
                <span className="font-mono text-[#ffcc00]">{format(value)}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value ?? 0} 
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full accent-[#ffcc00] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
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
        <div ref={panelRef} className="fixed bottom-0 left-0 w-full h-[320px] bg-[#050505]/95 backdrop-blur-2xl border-t border-[#ffcc00]/20 z-[9999] flex text-white font-sans shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            
            {/* Column 1: Branding, Tabs, Save */}
            <div className="w-[220px] shrink-0 border-r border-white/5 p-5 flex flex-col justify-between">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffcc00]">Antigravity Studio</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        {[
                            { id: 'camera', icon: Camera, label: 'Камеры (Секции)' },
                            { id: 'light', icon: Lightbulb, label: 'Освещение' },
                            { id: 'fx', icon: Zap, label: 'Эффекты (FX)' },
                            { id: 'mat', icon: Palette, label: 'Материалы' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/20' : 'text-white/40 border border-transparent hover:bg-white/5'}`}
                            >
                                <tab.icon size={14} />
                                <span className="text-[9px] font-bold uppercase">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${saved ? 'bg-green-500 text-white' : 'bg-[#ffcc00] text-black hover:scale-[1.02] active:scale-95'}`}
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <><Save size={14} /> Deploy</>}
                </button>
            </div>

            {/* Column 2: Contextual Configuration (Lights & FX) */}
            {activeTab !== 'camera' && activeTab !== 'mat' && (
                <div className="w-[240px] shrink-0 border-r border-white/5 p-5 flex flex-col gap-2 overflow-y-auto custom-scrollbar bg-white/[0.02]">
                    <h4 className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-2">Объекты</h4>

                {activeTab === 'light' && (
                    <>
                        {(config.lights || []).map(l => (
                            <button 
                                key={l.id} 
                                onClick={() => setActiveLightId(l.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold transition-all flex justify-between items-center ${activeLightId === l.id ? 'bg-[#ffcc00] text-black shadow-lg shadow-[#ffcc00]/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                            >
                                {l.name}
                                {activeLightId === l.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                            </button>
                        ))}
                        <button onClick={addLight} className="w-full mt-2 py-3 border border-dashed border-[#ffcc00]/30 text-[#ffcc00]/60 rounded-xl text-[10px] font-bold hover:bg-[#ffcc00]/10 hover:text-[#ffcc00] transition-all flex items-center justify-center gap-2">
                            <Plus size={14} /> Добавить Свет
                        </button>
                    </>
                )}

                {activeTab === 'fx' && (
                    <div className="flex flex-col gap-2">
                        <div className="text-[8px] text-white/40 mb-1">Слоты эффектов (Для текущего раздела: {SECTION_NAMES[activeSlug] || activeSlug})</div>
                        {[0,1,2,3,4].map(i => (
                            <button 
                                key={i}
                                onClick={() => setActiveSlot(i)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold transition-all flex justify-between items-center ${activeSlot === i ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                            >
                                Слот #{i+1}
                            </button>
                        ))}
                    </div>
                )}
                </div>
            )}

            {/* Column 3: Properties (Grid) */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                
                {activeTab === 'camera' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div>
                                <h4 className="text-[12px] font-black uppercase text-[#ffcc00]">Редактор Камеры</h4>
                                <p className="text-[9px] text-white/40">Раздел: {SECTION_NAMES[activeSlug] || activeSlug}</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={captureCamera}
                                    className="px-6 py-3 bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/20 rounded-xl text-[9px] font-black uppercase hover:bg-[#ffcc00] hover:text-black flex items-center justify-center gap-2 transition-all"
                                >
                                    <Camera size={14} /> Сохранить позицию мыши (Capture)
                                </button>
                                <button 
                                    onClick={() => updateSectionCamera(activeSlug, { pivotX: 0, pivotY: 5.1, pivotZ: 0 })}
                                    className="px-4 py-3 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Zap size={14} /> Центр Модели
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <h5 className="text-[8px] uppercase tracking-widest text-[#ffcc00]/50 mb-2">Орбитальные настройки (Поворот / Приближение)</h5>
                                {renderSlider('Azimuth (Поворот вокруг)', activeCam.azimuth, -180, 180, 1, (v) => updateSectionCamera(activeSlug, { azimuth: v }), v => `${v}°`)}
                                {renderSlider('Elevation (Высота/Наклон)', activeCam.polar, 0, 180, 1, (v) => updateSectionCamera(activeSlug, { polar: v }), v => `${v}°`)}
                                {renderSlider('Zoom (Радиус/Отдаление)', activeCam.radius, 1, 50, 0.5, (v) => updateSectionCamera(activeSlug, { radius: v }))}
                            </div>
                            <div className="space-y-5">
                                <h5 className="text-[8px] uppercase tracking-widest text-indigo-400/50 mb-2">Настройки фокуса (Точка куда смотрит камера)</h5>
                                {renderSlider('X (Влево/Вправо)', activeCam.pivotX, -20, 20, 0.1, (v) => updateSectionCamera(activeSlug, { pivotX: v }))}
                                {renderSlider('Y (Вверх/Вниз)', activeCam.pivotY, -15, 30, 0.1, (v) => updateSectionCamera(activeSlug, { pivotY: v }))}
                                {renderSlider('Z (Вперед/Назад)', activeCam.pivotZ, -20, 20, 0.1, (v) => updateSectionCamera(activeSlug, { pivotZ: v }))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'light' && (config.lights || []).find(l => l.id === activeLightId) && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[8px] uppercase tracking-widest text-[#ffcc00]/50">Настройки источника "{activeLightId}"</h5>
                                <button onClick={() => removeLight(activeLightId)} className="text-red-500/70 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                            </div>
                            {renderSlider('Intensity', (config.lights || []).find(l => l.id === activeLightId).intensity, 0, 2000, 10, (v) => updateLight(activeLightId, { intensity: v }))}
                            {renderSlider('Radius (Отдаление)', (config.lights || []).find(l => l.id === activeLightId).radius, 0, 50, 0.1, (v) => updateLight(activeLightId, { radius: v }))}
                        </div>
                        <div className="space-y-5">
                            <h5 className="text-[8px] uppercase tracking-widest text-transparent select-none">Spacer</h5>
                            {renderSlider('Azimuth (Поворот вокруг)', (config.lights || []).find(l => l.id === activeLightId).azimuth, 0, 360, 1, (v) => updateLight(activeLightId, { azimuth: v }), v => `${v}°`)}
                            {renderSlider('Height (Высота)', (config.lights || []).find(l => l.id === activeLightId).y, -20, 50, 0.1, (v) => updateLight(activeLightId, { y: v }))}
                        </div>
                    </div>
                )}

                {activeTab === 'fx' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between pb-2">
                                <label className="text-[8px] uppercase text-[#ffcc00]/50">Выбор Эффекта</label>
                                <input 
                                    type="checkbox" 
                                    checked={currentFX.active} 
                                    onChange={e => updateSectionFX(activeSlug, activeSlot, { active: e.target.checked })}
                                    className="w-4 h-4 accent-emerald-500"
                                />
                            </div>
                            <select 
                                value={currentFX.type} 
                                onChange={e => updateSectionFX(activeSlug, activeSlot, { type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] uppercase font-bold text-[#ffcc00] outline-none hover:border-emerald-500/40"
                            >
                                {FX_TYPES.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                            </select>

                            {renderSlider('Масштаб (Scale)', currentFX.scale, 0.1, 8.0, 0.1, (v) => updateSectionFX(activeSlug, activeSlot, { scale: v }))}
                            {renderSlider('Интенсивность', currentFX.intensity, 0, 2, 0.05, (v) => updateSectionFX(activeSlug, activeSlot, { intensity: v }))}
                        </div>

                        <div className="space-y-5">
                            <label className="text-[8px] uppercase text-[#ffcc00]/50 pb-2 block">Позиционирование & Цвет</label>
                            
                            <div className="grid grid-cols-3 gap-2">
                                {['X Offset', 'Y Offset', 'Z Offset'].map((axis, i) => (
                                    <div key={axis} className="space-y-1">
                                        <div className="text-[7px] text-white/40 uppercase font-mono">{axis}</div>
                                        <input 
                                            type="number" 
                                            value={currentFX.pos[i]} 
                                            step={0.1}
                                            onChange={e => {
                                                const newPos = [...currentFX.pos];
                                                newPos[i] = parseFloat(e.target.value);
                                                updateSectionFX(activeSlug, activeSlot, { pos: newPos });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-[#ffcc00]"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <input 
                                    type="color" 
                                    value={currentFX.color}
                                    onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })}
                                    className="h-10 w-24 bg-transparent cursor-pointer rounded overflow-hidden"
                                />
                                <input 
                                    type="text" 
                                    value={currentFX.color}
                                    onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 text-[11px] font-mono text-[#ffcc00] uppercase tracking-widest text-center"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mat' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <h5 className="text-[8px] uppercase tracking-widest text-[#ffcc00]/50 mb-2">Глобальная Трансформация Статуи</h5>
                            {renderSlider('Global Y', config.y, -18, 25, 0.1, (v) => setConfig({ y: v }))}
                            {renderSlider('Global Scale', config.scale, 1, 250, 1, (v) => setConfig({ scale: v }))}
                            {renderSlider('Rotation Y', config.rotationY, 0, 360, 1, (v) => setConfig({ rotationY: v }), v => `${v.toFixed(0)}°`)}
                        </div>
                        <div className="space-y-5">
                            <h5 className="text-[8px] uppercase tracking-widest text-[#ffcc00]/50 mb-2">Материал</h5>
                            {renderSlider('Roughness (Шероховатость)', config.roughness, 0, 1, 0.01, (v) => setConfig({ roughness: v }))}
                            {renderSlider('Metalness (Металличность)', config.metalness, 0, 1, 0.01, (v) => setConfig({ metalness: v }))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioEditor;
