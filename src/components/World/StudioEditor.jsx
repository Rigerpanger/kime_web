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
    
    // Actions
    const updateSectionCameraId = useAppStore(s => s.updateSectionCameraId);
    const updateSectionFX = useAppStore(s => s.updateSectionFX);
    const updateLight = useAppStore(s => s.updateLight);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);

    const updateCamera = useAppStore(s => s.updateCamera);
    const addCamera = useAppStore(s => s.addCamera);
    const removeCamera = useAppStore(s => s.removeCamera);
    const activeCameraId = useAppStore(s => s.activeCameraId);
    const setActiveCameraId = useAppStore(s => s.setActiveCameraId);

    const triggerCapture = useAppStore(s => s.triggerCapture);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('fx');
    const [activeSlot, setActiveSlot] = useState(0);

    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
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

    return (
        <div className="fixed bottom-10 right-10 w-[360px] bg-black/90 backdrop-blur-2xl border border-[#ffcc00]/20 rounded-3xl p-6 shadow-2xl z-[9999] flex flex-col gap-6 text-white font-sans">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffcc00]">Antigravity Studio</h3>
                </div>
                <div className="text-[9px] font-mono text-white/40 border border-white/10 px-2 py-0.5 rounded-full uppercase">
                    Slot: {activeSlug}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                {[
                    { id: 'light', icon: Lightbulb, label: 'Light' },
                    { id: 'camera', icon: Camera, label: 'Camera' },
                    { id: 'fx', icon: Zap, label: 'FX' },
                    { id: 'mat', icon: Palette, label: 'Mat' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${activeTab === tab.id ? 'bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/20' : 'text-white/40 hover:bg-white/5'}`}
                    >
                        <tab.icon size={14} />
                        <span className="text-[8px] font-black uppercase">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar space-y-6">
                {activeTab === 'light' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {(config.lights || []).map((l, i) => (
                                <button 
                                    key={l.id} 
                                    onClick={() => setActiveLightId(l.id)}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${activeLightId === l.id ? 'bg-[#ffcc00] text-black' : 'bg-white/5 text-white/60'}`}
                                >
                                    {l.name}
                                </button>
                            ))}
                            <button onClick={addLight} className="p-2 bg-[#ffcc00]/10 text-[#ffcc00] rounded-lg hover:bg-[#ffcc00]/20"><Plus size={14} /></button>
                        </div>
                        
                        {(config.lights || []).find(l => l.id === activeLightId) && (
                            <div className="space-y-4">
                                {renderSlider('Intensity', (config.lights || []).find(l => l.id === activeLightId).intensity, 0, 2000, 10, (v) => updateLight(activeLightId, { intensity: v }))}
                                {renderSlider('Azimuth', (config.lights || []).find(l => l.id === activeLightId).azimuth, 0, 360, 1, (v) => updateLight(activeLightId, { azimuth: v }), v => `${v}°`)}
                                {renderSlider('Radius', (config.lights || []).find(l => l.id === activeLightId).radius, 0, 50, 0.1, (v) => updateLight(activeLightId, { radius: v }))}
                                {renderSlider('Height', (config.lights || []).find(l => l.id === activeLightId).y, -20, 50, 0.1, (v) => updateLight(activeLightId, { y: v }))}
                                
                                <button 
                                    onClick={() => removeLight(activeLightId)}
                                    className="w-full py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-red-500/20 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={12} /> Remove Source
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'camera' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {(config.cameras || []).map((c) => (
                                <button 
                                    key={c.id} 
                                    onClick={() => setActiveCameraId(c.id)}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${activeCameraId === c.id ? 'bg-[#ffcc00] text-black' : 'bg-white/5 text-white/60'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                            <button onClick={addCamera} className="p-2 bg-[#ffcc00]/10 text-[#ffcc00] rounded-lg hover:bg-[#ffcc00]/20"><Plus size={14} /></button>
                        </div>
                        
                        {(config.cameras || []).find(c => c.id === activeCameraId) && (() => {
                            const activeCam = config.cameras.find(c => c.id === activeCameraId);
                            const sectionCamId = currentSection?.cameraId || config.cameras[0]?.id;
                            const isLinked = sectionCamId === activeCam.id;
                            
                            return (
                                <div className="space-y-4">
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => updateSectionCameraId(activeSlug, activeCam.id)}
                                            className={`w-full py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isLinked ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {isLinked ? '✔ Linked to Section' : 'Link to Current Section'}
                                        </button>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={captureCamera}
                                                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#ffcc00]/10 hover:border-[#ffcc00]/40 transition-all flex items-center justify-center gap-2"
                                                title="Grab position from Mouse Orbiting"
                                            >
                                                <Camera size={14} className="text-[#ffcc00]" /> 
                                                Capture 
                                            </button>
                                            <button 
                                                onClick={() => updateCamera(activeCam.id, { pivotX: 0, pivotY: 5.1, pivotZ: 0 })}
                                                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Zap size={14} className="text-emerald-400" />
                                                Refresh Pivot
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Orbital Sliders */}
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/10">
                                        <label className="text-[9px] text-[#ffcc00] font-black uppercase tracking-widest mb-2 block">Orbital Controls</label>
                                        {renderSlider('Azimuth (Orbit)', activeCam.azimuth, -180, 180, 1, (v) => updateCamera(activeCam.id, { azimuth: v }), v => `${v}°`)}
                                        {renderSlider('Elevation (Polar)', activeCam.polar, 0, 180, 1, (v) => updateCamera(activeCam.id, { polar: v }), v => `${v}°`)}
                                        {renderSlider('Zoom (Radius)', activeCam.radius, 1, 50, 0.5, (v) => updateCamera(activeCam.id, { radius: v }))}
                                    </div>

                                    {/* Pivot Sliders */}
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/10">
                                        <label className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-2 block">Target Focus (Pivot)</label>
                                        {renderSlider('X Offset (Left/Right)', activeCam.pivotX, -20, 20, 0.1, (v) => updateCamera(activeCam.id, { pivotX: v }))}
                                        {renderSlider('Y Offset (Up/Down)', activeCam.pivotY, -15, 30, 0.1, (v) => updateCamera(activeCam.id, { pivotY: v }))}
                                        {renderSlider('Z Offset (Fwd/Bck)', activeCam.pivotZ, -20, 20, 0.1, (v) => updateCamera(activeCam.id, { pivotZ: v }))}
                                    </div>

                                    <button 
                                        onClick={() => removeCamera(activeCam.id)}
                                        className="w-full py-2 mt-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete Preset
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {activeTab === 'fx' && (
                    <div className="space-y-6">
                        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                            {[0,1,2,3,4].map(i => (
                                <button 
                                    key={i}
                                    onClick={() => setActiveSlot(i)}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${activeSlot === i ? 'bg-[#ffcc00] text-black' : 'text-white/40'}`}
                                >
                                    #{i+1}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-white/60">Active Effect</span>
                                <input 
                                    type="checkbox" 
                                    checked={currentFX.active} 
                                    onChange={e => updateSectionFX(activeSlug, activeSlot, { active: e.target.checked })}
                                    className="w-4 h-4 accent-[#ffcc00]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] uppercase text-white/40">Effect Type</label>
                                <select 
                                    value={currentFX.type} 
                                    onChange={e => updateSectionFX(activeSlug, activeSlot, { type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] outline-none hover:border-[#ffcc00]/40"
                                >
                                    {FX_TYPES.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                                </select>
                            </div>

                            {renderSlider('Scale', currentFX.scale, 0.1, 8.0, 0.1, (v) => updateSectionFX(activeSlug, activeSlot, { scale: v }))}
                            {renderSlider('Intensity', currentFX.intensity, 0, 2, 0.05, (v) => updateSectionFX(activeSlug, activeSlot, { intensity: v }))}
                            
                            <div className="grid grid-cols-3 gap-2">
                                {['X', 'Y', 'Z'].map((axis, i) => (
                                    <div key={axis} className="space-y-1">
                                        <label className="text-[7px] text-white/30 uppercase">{axis} Pos</label>
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

                            <div className="space-y-2">
                                <label className="text-[8px] uppercase text-white/40">Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={currentFX.color}
                                        onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })}
                                        className="h-10 w-20 bg-transparent cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={currentFX.color}
                                        onChange={e => updateSectionFX(activeSlug, activeSlot, { color: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] font-mono text-[#ffcc00] uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mat' && (
                    <div className="space-y-6">
                        {renderSlider('Global Y', config.y, -18, 25, 0.1, (v) => setConfig({ y: v }))}
                        {renderSlider('Global Scale', config.scale, 1, 250, 1, (v) => setConfig({ scale: v }))}
                        {renderSlider('Rotation Y', config.rotationY, 0, 360, 1, (v) => setConfig({ rotationY: v }), v => `${v.toFixed(0)}°`)}
                        {renderSlider('Roughness', config.roughness, 0, 1, 0.01, (v) => setConfig({ roughness: v }))}
                        {renderSlider('Metalness', config.metalness, 0, 1, 0.01, (v) => setConfig({ metalness: v }))}
                    </div>
                )}
            </div>

            <button 
                onClick={handleSave} 
                disabled={saving}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${saved ? 'bg-green-500 text-white' : 'bg-[#ffcc00] text-black hover:scale-[1.02] active:scale-95'}`}
            >
                {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                    <Check size={16} />
                ) : (
                    <div className="flex items-center gap-3">
                        <Save size={16} />
                        <span>Deploy Scene</span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default StudioEditor;
