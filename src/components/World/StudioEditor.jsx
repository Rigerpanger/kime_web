import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, Check, Box, Palette, Lightbulb, Plus, Trash2, Upload } from 'lucide-react';

const AzimuthDial = ({ value, onChange }) => {
    const handleDrag = (e, rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = (angleRad * 180) / Math.PI + 90; // Adjust so 0 is North
        if (angleDeg < 0) angleDeg += 360;
        onChange(Math.round(angleDeg));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Orbit (Azimuth)</span>
            <div 
                onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleDrag(e, rect);
                    const moveHandler = (moveEvent) => handleDrag(moveEvent, rect);
                    const upHandler = () => {
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                    };
                    window.addEventListener('mousemove', moveHandler);
                    window.addEventListener('mouseup', upHandler);
                }}
                style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'grab',
                    background: 'radial-gradient(circle, rgba(255,204,0,0.05) 0%, rgba(0,0,0,0.5) 100%)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}
            >
                {/* Center point */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
                
                {/* Dial indicator arm */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '1px', height: '38px', background: 'rgba(255, 204, 0, 0.5)',
                    transformOrigin: 'top center',
                    transform: `rotate(${value - 180}deg)`,
                }}>
                    {/* The light bulb / point */}
                    <div style={{ 
                        width: '8px', height: '8px', borderRadius: '50%', 
                        background: '#ffcc00', position: 'absolute', bottom: '-4px', left: '-3.5px',
                        boxShadow: '0 0 10px #ffcc00'
                    }}/>
                </div>
            </div>
            <span style={{ fontSize: '10px', color: '#ffcc00', fontWeight: 'bold' }}>{value}°</span>
        </div>
    );
};

const StudioEditor = () => {
    const config = useAppStore(s => s.sculptureConfig);
    const setConfig = useAppStore(s => s.setSculptureConfig);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const updateLight = useAppStore(s => s.updateLight);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingHdri, setUploadingHdri] = useState(false);
    const [activeTab, setActiveTab] = useState('light'); // default to the new lighting tab

    const handleSlider = (key, val) => {
        setConfig({ [key]: parseFloat(val) });
        setSaved(false);
    };

    const handleHdriUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingHdri(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `custom-hdri-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('hdri')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('hdri')
                .getPublicUrl(fileName);

            setConfig({ hdriUrl: publicUrl });
            setSaved(false);
            alert('HDRI Uploaded successfully!');
        } catch (error) {
            console.error('HDRI upload error:', error);
            alert(`HDRI Upload Failed: ${error.message || 'Unknown error. Check Supabase RLS policies.'}`);
        } finally {
            setUploadingHdri(false);
            e.target.value = ''; // reset input
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    section_key: 'sculpture_config',
                    content_json: config,
                    updated_at: new Date()
                }, { onConflict: 'section_key' });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving sculpture config:', error);
            alert('Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const renderTabButton = (id, icon, label) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                flex: 1,
                padding: '10px 4px',
                background: activeTab === id ? 'rgba(255,204,0,0.1)' : 'transparent',
                border: `1px solid ${activeTab === id ? '#ffcc00' : 'rgba(255,255,255,0.1)'}`,
                color: activeTab === id ? '#ffcc00' : 'rgba(255,255,255,0.5)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '9px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}
        >
            {icon}
            {label}
        </button>
    );

    const renderGlobalSlider = (label, key, min, max, step, format = (v) => v.toFixed(2)) => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>
                <span>{label}</span>
                <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{format(config[key] ?? 0)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={config[key] ?? 0} 
                onChange={e => handleSlider(key, e.target.value)} 
                style={{ width: '100%', cursor: 'pointer', accentColor: '#ffcc00' }}
            />
        </div>
    );

    // Active light
    const activeLight = config.lights?.find(l => l.id === activeLightId);

    return (
        <div style={{
            position: 'fixed', bottom: '40px', right: '40px', 
            background: 'rgba(5, 5, 5, 0.98)', padding: '24px', 
            borderRadius: '24px', border: '1px solid rgba(255, 204, 0, 0.2)',
            color: 'white', zIndex: 999999, width: '340px',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px',
            boxShadow: '0 20px 80px rgba(0,0,0,1)',
            pointerEvents: 'auto',
            backdropFilter: 'blur(20px)',
            userSelect: 'none',
            display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#ffcc00', letterSpacing: '4px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                    Sculpture Studio
                </h4>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffcc00', boxShadow: '0 0 15px #ffcc00' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                {renderTabButton('transform', <Box size={14}/>, 'Trans')}
                {renderTabButton('material', <Palette size={14}/>, 'Mat')}
                {renderTabButton('light', <Lightbulb size={14}/>, 'Light')}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '260px' }}>
                
                {/* --- TRANSFORM TAB --- */}
                {activeTab === 'transform' && (
                    <>
                        {renderGlobalSlider('Position Y', 'y', -18, 25, 0.1)}
                        {renderGlobalSlider('Scale', 'scale', 1, 250, 1.0, v => v.toFixed(1))}
                        {renderGlobalSlider('Rotation Y', 'rotationY', 0, 360, 1, v => `${v.toFixed(0)}°`)}
                    </>
                )}

                {/* --- MATERIAL TAB --- */}
                {activeTab === 'material' && (
                    <>
                        {renderGlobalSlider('Roughness', 'roughness', 0, 1, 0.01)}
                        {renderGlobalSlider('Metalness', 'metalness', 0, 1, 0.01)}
                        {renderGlobalSlider('Env Reflection', 'envMapIntensity', 0, 2, 0.01)}
                        {renderGlobalSlider('Glow/Emission', 'emissiveIntensity', 0, 10, 0.1)}

                        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '12px' }}>
                                Custom Environment (HDRI)
                            </div>
                            
                            {config.hdriUrl && (
                                <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '8px', wordBreak: 'break-all' }}>
                                    Active: Custom HDRI Map loaded.
                                </div>
                            )}

                            <label style={{
                                width: '100%', padding: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
                                cursor: 'pointer', border: '1px dashed rgba(255, 255, 255, 0.2)'
                            }}>
                                {uploadingHdri ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                {uploadingHdri ? 'Uploading...' : 'Upload .hdr / .exr'}
                                <input 
                                    type="file" 
                                    accept=".hdr,.exr" 
                                    style={{ display: 'none' }} 
                                    onChange={handleHdriUpload} 
                                    disabled={uploadingHdri}
                                />
                            </label>
                            
                            {config.hdriUrl && (
                                <button 
                                    onClick={() => handleSlider('hdriUrl', null)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
                                >
                                    Remove custom Environment
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* --- LIGHT TAB --- */}
                {activeTab === 'light' && (
                    <>
                        {renderGlobalSlider('Bloom Intensity', 'bloomIntensity', 0, 5, 0.05)}
                        {renderGlobalSlider('Bloom Radius', 'bloomRadius', 0, 3, 0.05)}
                        {renderGlobalSlider('Mouse Flashlight', 'mouseLightIntensity', 0, 1000, 10, v => v.toFixed(0))}

                        <div style={{ 
                            border: '1px solid rgba(255,204,0,0.2)', padding: '16px', borderRadius: '12px',
                            background: 'rgba(255,204,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px'
                        }}>
                            {/* Light List & Add */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <select 
                                    value={activeLightId || ''} 
                                    onChange={(e) => setActiveLightId(e.target.value)}
                                    style={{ 
                                        background: 'rgba(0,0,0,0.5)', color: 'white', padding: '6px', borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', outline: 'none', width: '60%'
                                    }}
                                >
                                    {config.lights?.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={() => addLight()}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', display:'flex', alignItems:'center', justifyContent:'center', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {activeLight ? (
                                <>
                                    {/* Light Name & Delete */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <input 
                                            value={activeLight.name}
                                            onChange={(e) => updateLight(activeLight.id, { name: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#ffcc00', outline: 'none', fontSize: '11px', paddingBottom: '4px' }}
                                        />
                                        <button 
                                            onClick={() => removeLight(activeLight.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Spatial Controller */}
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px' }}>
                                        <AzimuthDial 
                                            value={activeLight.azimuth} 
                                            onChange={(val) => { updateLight(activeLight.id, { azimuth: val }); setSaved(false); }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                            {/* Radius / Distance Slider */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    <span>Distance</span>
                                                    <span>{activeLight.radius}</span>
                                                </div>
                                                <input type="range" min="0" max="60" step="0.5" value={activeLight.radius} 
                                                    onChange={e => { updateLight(activeLight.id, { radius: parseFloat(e.target.value) }); setSaved(false); }} 
                                                    style={{ width: '100%', accentColor: 'white' }}
                                                />
                                            </div>
                                            {/* Height / Y Slider */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    <span>Height</span>
                                                    <span>{activeLight.y}</span>
                                                </div>
                                                <input type="range" min="-10" max="60" step="0.5" value={activeLight.y} 
                                                    onChange={e => { updateLight(activeLight.id, { y: parseFloat(e.target.value) }); setSaved(false); }} 
                                                    style={{ width: '100%', accentColor: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Intensity & Color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                <span>Intensity</span>
                                                <span>{activeLight.intensity}</span>
                                            </div>
                                            <input type="range" min="0" max="10000" step="50" value={activeLight.intensity} 
                                                onChange={e => { updateLight(activeLight.id, { intensity: parseFloat(e.target.value) }); setSaved(false); }} 
                                                style={{ width: '100%', accentColor: 'white' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Color</span>
                                            <input 
                                                type="color" 
                                                value={activeLight.color} 
                                                onChange={e => { updateLight(activeLight.id, { color: e.target.value }); setSaved(false); }}
                                                style={{ width: '28px', height: '28px', border: 'none', padding: 0, borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                            />
                                        </div>
                                    </div>

                                </>
                            ) : (
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0 }}>
                                    No lights available. Create one to begin.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: saved ? '#10b981' : '#ffcc00',
                    color: saved ? 'white' : 'black',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '8px'
                }}
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : (saved ? <Check size={16} /> : <Save size={16} />)}
                {saving ? 'Saving...' : (saved ? 'Saved!' : 'Save Changes')}
            </button>
        </div>
    );
};

export default StudioEditor;
