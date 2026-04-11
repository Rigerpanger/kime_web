import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { Save, Loader2, Check, Camera, Lightbulb, Trash2, Zap, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import useActiveSlug from '../../hooks/useActiveSlug';

const FX_TYPES = ['None', 'NeuralAtom', 'NeuralSwarm', 'ShapeShifter', 'SoftwareSilhouette', 'TetrisReveal', 'Iris', 'HoloGrid', 'NeonEdges', 'QuantumDust', 'CyberWaves', 'DataStream', 'GeoSwarm', 'SacredGeometry', 'SynapseCore', 'MilkyWay', 'Levitation', 'EngineGizmo', 'SpatialAR'];

const SECTION_NAMES = {
    "default": "Главная (Home)",
    "about": "О компании (About)",
    "services": "Услуги (Services)",
    "projects": "Проекты (Projects)",
    "contact": "Контакты (Contact)",
    "about-studio": "О нас: Студия",
    "about-approach": "О нас: Подход",
    "about-founder": "О нас: Видение",
    "about-certificates": "О нас: Достижения",
    "digital-graphics": "Служба: Digital Graphics",
    "ar-vr": "Служба: AR/VR",
    "software-dev": "Служба: Software Dev",
    "gamedev": "Служба: GameDev",
    "ai-ml": "Служба: AI / ML"
};

const StudioEditor = () => {
    const { session, signIn } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    const config = useAppStore(s => s.sculptureConfig);
    const setConfig = useAppStore(s => s.setSculptureConfig);
    const activeSlug = useActiveSlug() || 'default';
    const setIsOverPanel = useAppStore(s => s.setIsOverPanel);
    
    const updateSectionFX = useAppStore(s => s.updateSectionFX);
    const addSectionFX = useAppStore(s => s.addSectionFX);
    const removeSectionFX = useAppStore(s => s.removeSectionFX);
    const updateSectionCamera = useAppStore(s => s.updateSectionCamera);
    const updateLight = useAppStore(s => s.updateLight);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);
    
    const [activeFXId, setActiveFXId] = useState(null);
    const [activeTab, setActiveTab] = useState('camera');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showAdvancedCam, setShowAdvancedCam] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [captured, setCaptured] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState(null);
    
    const triggerCapture = useAppStore(s => s.triggerCapture);

    useEffect(() => {
        return () => setIsOverPanel(false);
    }, []);

    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
    const activeCam = currentSection?.camera || { azimuth: 0, polar: 90, radius: 18, pivotX: 0, pivotY: 5.1, pivotZ: 0 };
    const sectionFX = currentSection?.fx || [];
    const activeFX = sectionFX.find(f => f.id === activeFXId) || sectionFX[0];

    const handleSave = async () => {
        setSaving(true);
        setLoginError(null);
        try {
            if (!session?.token) {
                setShowLogin(true);
                throw new Error("Login required");
            }
            const latestConfig = useAppStore.getState().sculptureConfig;
            const response = await fetch(`${apiUrl}/content/sculpture_config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
                body: JSON.stringify(latestConfig)
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else if (response.status === 401) {
                setShowLogin(true);
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleInlineLogin = async (e) => {
        e.preventDefault();
        try {
            await signIn(loginEmail, loginPass);
            setShowLogin(false);
        } catch (err) {
            setLoginError(err.message);
        }
    };

    const nuclearReset = useAppStore(s => s.nuclearReset);

    const renderSlider = (label, value, min, max, step, onChange, format = (v) => v?.toFixed(2)) => (
        <div className="space-y-1">
            <div className="flex justify-between text-[7px] uppercase tracking-widest text-[#ffcc00]/50 font-bold">
                <span>{label}</span>
                <span className="font-mono text-[#ffcc00]">{format(value)}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={value ?? 0} 
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full accent-[#ffcc00] h-0.5 bg-white/5 rounded-full appearance-none cursor-pointer"
            />
        </div>
    );

    return (
        <div 
            onMouseEnter={() => setIsOverPanel(true)}
            onMouseLeave={() => setIsOverPanel(false)}
            className={`fixed bottom-0 left-0 w-full transition-all duration-500 ease-in-out bg-[#050505]/98 backdrop-blur-3xl border-t border-[#ffcc00]/20 z-[9999] flex text-white font-sans shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${((showLogin || !session) && window.location.hostname !== 'localhost') ? 'h-full' : (isCollapsed ? 'h-[32px]' : 'h-[240px]')}`}
        >
            {/* LOGIN OVERLAY - Bypassed for localhost to allow focus on UX */}
            {(showLogin && window.location.hostname !== 'localhost') && (
                <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[10002] flex items-center justify-center p-4">
                    <div className="w-full max-w-[320px] bg-[#0c0c0c] border border-[#ffcc00]/20 p-8 rounded-2xl space-y-6 relative -top-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Zap className="text-[#ffcc00]" size={20} fill="currentColor" />
                            <div>
                                <h2 className="text-[#ffcc00] font-black uppercase tracking-[0.2em] text-[11px]">STUDIO AUTH</h2>
                                <p className="text-white/20 text-[7px] uppercase font-bold tracking-widest">Admin protection</p>
                            </div>
                        </div>
                        <form onSubmit={handleInlineLogin} className="space-y-4">
                            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-[10px]" placeholder="Email" />
                            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-[10px]" placeholder="Password" />
                            <button type="submit" className="w-full bg-[#ffcc00] text-black py-3 rounded text-[10px] font-black uppercase tracking-widest">Login to Edit</button>
                        </form>
                    </div>
                </div>
            )}

            <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute top-[-26px] right-8 px-4 py-1 bg-[#ffcc00] text-black rounded-t-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest z-[10001]">
                {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {isCollapsed ? 'Open' : 'Close'}
            </button>

            {isCollapsed ? (
                <div className="w-full h-full flex items-center px-6 gap-6 opacity-50">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-[#ffcc00]">Antigravity Studio</h3>
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{SECTION_NAMES[activeSlug] || activeSlug}</div>
                </div>
            ) : (
                <div className="flex w-full h-full overflow-hidden">
                    {/* SIDEBAR */}
                    <div className="w-[80px] border-r border-white/5 p-2 flex flex-col gap-1.5 bg-black/20 overflow-y-auto custom-scrollbar">
                        {[{ id: 'camera', icon: Camera, label: 'Cam' }, { id: 'fx', icon: Zap, label: 'FX' }, { id: 'light', icon: Lightbulb, label: 'Light' }, { id: 'mat', icon: Palette, label: 'Mat' }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex flex-col items-center py-1 rounded transition-all ${activeTab === tab.id ? 'bg-[#ffcc00]/10 text-[#ffcc00]' : 'text-white/20'}`}>
                                <tab.icon size={12} />
                                <span className="text-[6px] font-black uppercase mt-0.5">{tab.label}</span>
                            </button>
                        ))}
                        <button onClick={handleSave} disabled={saving} className={`w-full py-2 mt-auto rounded font-black uppercase text-[7px] ${saved ? 'bg-green-500' : 'bg-[#ffcc00] text-black'}`}>
                            {saving ? '...' : saved ? 'OK' : 'Save'}
                        </button>
                        
                        {window.location.hostname === 'localhost' && (
                            <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-2">
                                <button 
                                    onClick={() => useAppStore.getState().pullFromProductionDB()} 
                                    className="w-full py-1.5 rounded font-black uppercase text-[5px] bg-teal-600/80 text-white hover:bg-teal-500 transition-all"
                                    title="Import settings from live website database"
                                >
                                    Pull Web
                                </button>
                                <button 
                                    onClick={() => useAppStore.getState().saveToGoldenFile()} 
                                    className="w-full py-1.5 rounded font-black uppercase text-[5px] bg-indigo-600/80 text-white hover:bg-indigo-500 transition-all"
                                    title="Save to local goldenConfig.json"
                                >
                                    Push Gold
                                </button>
                            </div>
                        )}
                    </div>

                    {/* LIST (FX/LIGHT) */}
                    {(activeTab === 'fx' || activeTab === 'light') && (
                        <div className="w-[140px] border-r border-white/5 p-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pb-10">
                            <h4 className="text-[7px] uppercase font-bold tracking-widest text-white/20">List</h4>
                            {activeTab === 'light' ? (
                                <>
                                    {config.lights?.map(l => (
                                        <button key={l.id} onClick={() => setActiveLightId(l.id)} className={`w-full text-left px-2 py-1.5 rounded text-[8px] font-bold ${activeLightId === l.id ? 'bg-[#ffcc00] text-black' : 'bg-white/5 text-white/40'}`}>{l.name}</button>
                                    ))}
                                    <button onClick={() => addLight()} className="w-full py-2 mt-2 border border-dashed border-[#ffcc00]/20 text-[#ffcc00]/40 text-[7px] font-bold rounded hover:bg-[#ffcc00]/5 transition-all">+ Add Light</button>
                                </>
                            ) : (
                                <>
                                    {sectionFX.map(f => (
                                        <button key={f.id} onClick={() => setActiveFXId(f.id)} className={`w-full text-left px-2 py-1.5 rounded text-[8px] font-bold ${activeFXId === f.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}>{f.type}</button>
                                    ))}
                                    <select onChange={e => { if (e.target.value !== 'None') { addSectionFX(activeSlug, e.target.value); e.target.value = 'None'; } }} className="w-full py-2 mt-2 bg-white/5 text-[7px] border border-dashed border-emerald-500/20 text-emerald-500/40 rounded transition-all hover:bg-emerald-500/5 cursor-pointer">
                                        <option value="None" className="bg-black">+ Add Effect</option>
                                        {FX_TYPES.filter(t => t !== 'None').map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    )}

                    {/* CONTENT */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        {activeTab === 'camera' && (
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h5 className="text-[7px] uppercase text-[#ffcc00]/40 font-bold">1. Camera Rescue</h5>
                                    <button 
                                        onClick={() => { 
                                            nuclearReset();
                                        }}
                                        className="w-full py-3 bg-red-600/20 border border-red-500/50 text-red-500 rounded font-black text-[9px] uppercase hover:bg-red-600/40 transition-all text-center"
                                    >
                                        FORCE RESET VIEW
                                    </button>
                                    <button onClick={() => { triggerCapture(); setCaptured(true); setTimeout(() => setCaptured(false), 1500); }} className={`w-full py-3 rounded font-black text-[9px] uppercase border ${captured ? 'bg-green-500 border-green-400' : 'bg-white/5 border-white/10 text-white/40 opacity-50'}`}>
                                        {captured ? 'Captured' : 'Freeze View'}
                                    </button>
                                </div>
                                <div className="space-y-4 pt-4">
                                    {renderSlider('Vertical Framing', activeCam.pivotY ?? 5.1, -20, 30, 0.1, (v) => updateSectionCamera(activeSlug, { pivotY: v }))}
                                    {renderSlider('FOV Zoom', activeCam.radius, 1, 90, 0.5, (v) => updateSectionCamera(activeSlug, { radius: v }))}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><h5 className="text-[7px] uppercase text-indigo-400/40 font-bold">3. Advanced</h5><button onClick={() => setShowAdvancedCam(!showAdvancedCam)} className="text-[6px] text-white/20 uppercase">{showAdvancedCam ? 'Hide' : 'Show'}</button></div>
                                    {showAdvancedCam && (
                                        <div className="space-y-2 p-2 bg-white/5 rounded">
                                            <button 
                                                onClick={() => { 
                                                    if (window.resetSculpture) window.resetSculpture();
                                                }}
                                                className="w-full py-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded text-[7px] font-black uppercase mb-2 hover:bg-red-900/40 transition-colors"
                                            >
                                                Emergency Reset Model
                                            </button>
                                            {renderSlider('Section Scale', currentSection?.scale ?? 17.0, 1, 500, 1, (v) => updateSectionCamera(activeSlug, { scale: v }))}
                                            {renderSlider('Angle (Azim)', activeCam.azimuth, -180, 180, 1, (v) => updateSectionCamera(activeSlug, { azimuth: v }), v => `${v}°`)}
                                            {renderSlider('Height (Polar)', activeCam.polar, 1, 179, 1, (v) => updateSectionCamera(activeSlug, { polar: v }), v => `${v}°`)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'light' && config.lights?.find(l => l.id === activeLightId) && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-[8px] font-black uppercase text-[#ffcc00]">{activeLightId}</span><button onClick={() => removeLight(activeLightId)} className="text-red-500/30"><Trash2 size={10}/></button></div>
                                    {renderSlider('Intensity', config.lights.find(l => l.id === activeLightId).intensity, 0, 150, 1, (v) => updateLight(activeLightId, { intensity: v }))}
                                    {renderSlider('Radius', config.lights.find(l => l.id === activeLightId).radius, 0, 50, 0.1, (v) => updateLight(activeLightId, { radius: v }))}
                                </div>
                                <div className="space-y-4 pt-5">
                                    {renderSlider('Azimuth', config.lights.find(l => l.id === activeLightId).azimuth, 0, 360, 1, (v) => updateLight(activeLightId, { azimuth: v }))}
                                    {renderSlider('Height Y', config.lights.find(l => l.id === activeLightId).y, -10, 40, 0.1, (v) => updateLight(activeLightId, { y: v }))}
                                </div>
                                
                                <div className="col-span-2 mt-4 pt-4 border-t border-white/5 space-y-4">
                                    <div className="grid grid-cols-2 gap-8">
                                        {renderSlider('Mouse Light', config.mouseLightIntensity ?? 150, 0, 1000, 10, (v) => setConfig({ mouseLightIntensity: v }))}
                                        {renderSlider('Ambient Light', config.ambientIntensity ?? 0.2, 0, 2, 0.05, (v) => setConfig({ ambientIntensity: v }))}
                                    </div>
                                </div>
                            </div>
                        )}


                        {activeTab === 'fx' && activeFX && (
                            <div className="grid grid-cols-2 gap-8 h-full">
                                <div className="space-y-4 overflow-y-auto pr-2">
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-[8px] font-black text-[#ffcc00] uppercase">{activeFX.type}</span><div className="flex gap-2"><input type="checkbox" checked={activeFX.active} onChange={e => updateSectionFX(activeSlug, activeFX.id, { active: e.target.checked })} /><button onClick={() => removeSectionFX(activeSlug, activeFX.id)} className="text-red-500/30"><Trash2 size={10}/></button></div></div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            {renderSlider('Radius (Dist)', activeFX.radius ?? 4.5, 0.02, 20, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { radius: v }))}
                                            {renderSlider('Azimuth (Orb)', activeFX.azimuth ?? 0, -180, 180, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { azimuth: v }), v => `${v}°`)}
                                            {renderSlider('Height (Y)', activeFX.height ?? 4.8, -25, 25, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { height: v }))}
                                            {renderSlider('Offset (X)', activeFX.offsetX ?? 0, -10, 10, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { offsetX: v }))}
                                            {renderSlider('Depth (Z)', activeFX.depth ?? 0, -10, 10, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { depth: v }))}
                                            {renderSlider('Intensity', activeFX.intensity ?? 1.0, 0, 5, 0.1, (v) => updateSectionFX(activeSlug, activeFX.id, { intensity: v }))}
                                            {renderSlider('Variant (Mode)', activeFX.variant ?? 0, 0, 1, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { variant: v }))}
                                            {renderSlider('Scale', activeFX.scale ?? 1.0, 0.01, 10, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { scale: v }))}
                                            {renderSlider('Speed', activeFX.speed ?? 1.0, 0, 5, 0.1, (v) => updateSectionFX(activeSlug, activeFX.id, { speed: v }))}
                                        </div>
                                        <div className="flex items-center gap-1"><span className="text-[6px] text-white/20 uppercase">Main Color</span><input type="color" value={activeFX.color || '#ffcc00'} onChange={e => updateSectionFX(activeSlug, activeFX.id, { color: e.target.value })} className="h-4 w-6 bg-transparent" /></div>
                                    </div>
                                </div>
                                <div className="space-y-3 overflow-y-auto pr-2">
                                    <h5 className="text-[7px] uppercase text-white/20 font-bold border-b border-white/5 pb-1">Behaviors & Modes</h5>
                                    {['SynapseCore'].includes(activeFX.type) && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            {renderSlider('Pulse Size', activeFX.pulseSize ?? 1.0, 0.1, 5, 0.1, (v) => updateSectionFX(activeSlug, activeFX.id, { pulseSize: v }))}
                                            {renderSlider('Node Size', activeFX.nodeSize ?? 1.0, 0.1, 5, 0.1, (v) => updateSectionFX(activeSlug, activeFX.id, { nodeSize: v }))}
                                            {renderSlider('Line Width', activeFX.lineWidth ?? 1.0, 0.1, 5, 0.1, (v) => updateSectionFX(activeSlug, activeFX.id, { lineWidth: v }))}
                                            {['LogicArchitect'].includes(activeFX.type) && renderSlider('Grid Density', activeFX.variant ?? 4, 3, 6, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { variant: v }))}
                                        </div>
                                    )}
                                    {['NeuralAtom', 'NeuralSwarm', 'ShapeShifter', 'SoftwareSilhouette', 'LogicArchitect'].includes(activeFX.type) && (
                                        <div className="grid grid-cols-3 gap-1">
                                            {(activeFX.type === 'NeuralAtom' ? ['Orbit', 'Pulse', 'Glitch'] : activeFX.type === 'NeuralSwarm' ? ['Orbit', 'Flow', 'Chaos'] : activeFX.type === 'ShapeShifter' ? ['Pulse', 'Glitch', 'Float'] : ['Rain', 'Orbit', 'Static']).map(b => (
                                                <button key={b} onClick={() => updateSectionFX(activeSlug, activeFX.id, { behavior: b })} className={`py-1 rounded text-[6px] font-bold border ${activeFX.behavior === b ? 'bg-[#ffcc00] text-black' : 'bg-white/5 text-white/40'}`}>{b}</button>
                                            ))}
                                        </div>
                                    )}
                                    {activeFX.type === 'ShapeShifter' && <div className="grid grid-cols-3 gap-1">{['Solid', 'Wire', 'Points'].map(m => (<button key={m} onClick={() => updateSectionFX(activeSlug, activeFX.id, { mode: m })} className={`py-1 rounded text-[6px] font-bold border ${activeFX.mode === m ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}>{m}</button>))}</div>}
                                    {activeFX.type === 'HoloGrid' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-3 gap-1">{['Square', 'Hex', 'Dots'].map((p, i) => (<button key={p} onClick={() => updateSectionFX(activeSlug, activeFX.id, { patternIndex: i })} className={`py-1 rounded text-[6px] font-bold border ${activeFX.patternIndex === i ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/40'}`}>{p}</button>))}</div>
                                            {renderSlider('Density (Count)', activeFX.density ?? 20, 1, 100, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { density: v }))}
                                            {renderSlider('Thickness (Line)', activeFX.thickness ?? 0.08, 0.01, 0.5, 0.01, (v) => updateSectionFX(activeSlug, activeFX.id, { thickness: v }))}
                                        </div>
                                    )}
                                    {activeFX.type === 'GeoSwarm' && (
                                        <div className="space-y-3">
                                            {renderSlider('Shape Variations', activeFX.variety ?? 3, 1, 6, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { variety: v }))}
                                            {renderSlider('Particle Density', activeFX.density ?? 600, 100, 2000, 10, (v) => updateSectionFX(activeSlug, activeFX.id, { density: v }))}
                                        </div>
                                    )}
                                    {activeFX.type === 'NeonEdges' && <div className="grid grid-cols-2 gap-1"><button onClick={() => updateSectionFX(activeSlug, activeFX.id, { metalness: !activeFX.metalness })} className={`py-1 rounded text-[6px] font-bold ${activeFX.metalness ? 'bg-[#ffcc00] text-black' : 'bg-white/5'}`}>Metal</button><button onClick={() => updateSectionFX(activeSlug, activeFX.id, { rainbow: !activeFX.rainbow })} className={`py-1 rounded text-[6px] font-bold ${activeFX.rainbow ? 'bg-indigo-500 text-white' : 'bg-white/5'}`}>Rainbow</button></div>}
                                    {activeFX.type === 'Iris' && <div className="grid grid-cols-2 gap-1">{['Liquid', 'Pulse', 'Metal', 'Glitch'].map((p, i) => (<button key={p} onClick={() => updateSectionFX(activeSlug, activeFX.id, { presetIndex: i })} className={`py-1 rounded text-[6px] font-bold ${activeFX.presetIndex === i ? 'bg-purple-500' : 'bg-white/5'}`}>{p}</button>))}</div>}
                                    {activeFX.type === 'CyberWaves' && (
                                        <div className="space-y-2">
                                            {renderSlider('Rotation X', activeFX.rotationX ?? -90, -180, 180, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { rotationX: v }))}
                                            {renderSlider('Rotation Y', activeFX.rotationY ?? 0, -180, 180, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { rotationY: v }))}
                                            {renderSlider('Rotation Z', activeFX.rotationZ ?? 0, -180, 180, 1, (v) => updateSectionFX(activeSlug, activeFX.id, { rotationZ: v }))}
                                        </div>
                                    )}
                                    {activeFX.type === 'SpatialAR' && (
                                        <div className="pt-2 border-t border-white/5">
                                            <button 
                                                onClick={() => updateSectionFX(activeSlug, activeFX.id, { showMask: !activeFX.showMask })}
                                                className={`w-full py-2 rounded text-[7px] font-black uppercase transition-all ${activeFX.showMask !== false ? 'bg-[#44aaff] text-white' : 'bg-white/5 text-white/20'}`}
                                            >
                                                {activeFX.showMask !== false ? 'AR Mask: ON' : 'AR Mask: OFF'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'mat' && (
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <h5 className="text-[7px] uppercase text-white/20 font-bold border-b border-white/5 pb-1">Global Transform</h5>
                                    {renderSlider('Model Y', config.y, -15, 20, 0.1, (v) => setConfig({ y: v }))}
                                    {renderSlider('Global Scale', config.scale, 1, 300, 1, (v) => setConfig({ scale: v }))}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        {renderSlider('FX Orbit Dist', config.orbitRadius || 0, 0, 30, 0.1, (v) => setConfig({ orbitRadius: v }))}
                                        {renderSlider('FX Orbit Rot', config.orbitAzimuth || 0, 0, 360, 1, (v) => setConfig({ orbitAzimuth: v }))}
                                        {renderSlider('Ambient Dust', config.bgParticlesIntensity ?? 0.5, 0, 2, 0.1, (v) => setConfig({ bgParticlesIntensity: v }))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[7px] uppercase text-white/20 font-bold border-b border-white/5 pb-1">Material</h5>
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
