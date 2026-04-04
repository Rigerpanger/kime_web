import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import { Save, Loader2, Check, Box, Palette, Lightbulb, Plus, Trash2, Upload } from 'lucide-react';

const AzimuthDial = ({ value, onChange }) => {
    const handleDrag = (e, rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;
        onChange(Math.round(angleDeg));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Orbit</span>
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
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'grab', background: 'radial-gradient(circle, rgba(255,204,0,0.05) 0%, rgba(0,0,0,0.5) 100%)' }}
            >
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1px', height: '38px', background: 'rgba(255, 204, 0, 0.5)', transformOrigin: 'top center', transform: `rotate(${value - 180}deg)` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffcc00', position: 'absolute', bottom: '-4px', left: '-3.5px', boxShadow: '0 0 10px #ffcc00' }}/>
                </div>
            </div>
            <span style={{ fontSize: '10px', color: '#ffcc00', fontWeight: 'bold' }}>{value}°</span>
        </div>
    );
};

const StudioEditor = () => {
    const { session } = useAuthStore();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const config = useAppStore(s => s.sculptureConfig);
    const setConfig = useAppStore(s => s.setSculptureConfig);
    const activeLightId = useAppStore(s => s.activeLightId);
    const setActiveLightId = useAppStore(s => s.setActiveLightId);
    const addLight = useAppStore(s => s.addLight);
    const removeLight = useAppStore(s => s.removeLight);
    const updateLight = useAppStore(s => s.updateLight);
    const activeSlug = useAppStore(s => s.activeSlug);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('fx');

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!session?.token) throw new Error("Вы не авторизованы.");
            const response = await fetch(`${apiUrl}/content/sculpture_config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
                body: JSON.stringify(config)
            });
            if (response.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
        } catch (error) { alert('Error: ' + error.message); }
        finally { setSaving(false); }
    };

    const renderTabButton = (id, icon, label) => (
        <button onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '10px', background: activeTab === id ? 'rgba(255,204,0,0.1)' : 'transparent', border: `1px solid ${activeTab === id ? '#ffcc00' : 'rgba(255,255,255,0.1)'}`, color: activeTab === id ? '#ffcc00' : 'rgba(255,255,255,0.5)', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>{icon}{label}</button>
    );

    const renderSlider = (label, value, min, max, step, onChange, format = (v) => v.toFixed(1)) => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '9px', textTransform: 'uppercase', opacity: 0.5 }}>
                <span>{label}</span><span style={{ color: '#ffcc00' }}>{format(value ?? 0)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value ?? 0} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ffcc00' }} />
        </div>
    );

    const activeLight = config.lights?.find(l => l.id === activeLightId);

    return (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: 'rgba(5, 5, 5, 0.95)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 204, 0, 0.2)', color: 'white', zIndex: 999999, width: '340px', boxShadow: '0 20px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#ffcc00', letterSpacing: '4px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>STUDIO</h4>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                {renderTabButton('transform', <Box size={14}/>, 'Pos')}
                {renderTabButton('material', <Palette size={14}/>, 'Mat')}
                {renderTabButton('fx', <Box size={14}/>, 'FX')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '300px' }}>
                {activeTab === 'transform' && (
                    <>
                        {renderSlider('Body Height (Y)', config.y, -18, 25, 0.1, (v) => setConfig({ y: v }))}
                        {renderSlider('Body Scale', config.scale, 1, 250, 1, (v) => setConfig({ scale: v }))}
                        {renderSlider('Body Rotation', config.rotationY, 0, 360, 1, (v) => setConfig({ rotationY: v }), v => `${v.toFixed(0)}°`)}
                    </>
                )}

                {activeTab === 'material' && (
                    <>
                        {renderSlider('Roughness', config.roughness, 0, 1, 0.01, (v) => setConfig({ roughness: v }))}
                        {renderSlider('Metalness', config.metalness, 0, 1, 0.01, (v) => setConfig({ metalness: v }))}
                        {renderSlider('Reflections', config.envMapIntensity, 0, 2, 0.01, (v) => setConfig({ envMapIntensity: v }))}
                    </>
                )}

                {activeTab === 'fx' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '9px', color: '#ffcc00', marginBottom: '10px' }}>FLASH CONFIG</div>
                            {renderSlider('Height', config.flashFX?.y, -10, 30, 0.1, (v) => setConfig({ flashFX: { ...config.flashFX, y: v } }))}
                            {renderSlider('Power', config.flashFX?.intensity, 0, 500, 10, (v) => setConfig({ flashFX: { ...config.flashFX, intensity: v } }), v => v.toFixed(0))}
                        </div>

                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '9px', color: '#ffcc00' }}>SECTION: {activeSlug || 'NONE'}</div>
                            {activeSlug === 'ai-ml' && (
                                <>
                                    {renderSlider('Core Y', config.aiFX?.y, -10, 30, 0.1, (v) => setConfig({ aiFX: { ...config.aiFX, y: v } }))}
                                    {renderSlider('Core Scale', config.aiFX?.scale, 0.1, 10, 0.1, (v) => setConfig({ aiFX: { ...config.aiFX, scale: v } }))}
                                    <div style={{ alignSelf: 'center' }}><AzimuthDial value={config.aiFX?.orbit || 0} onChange={(v) => setConfig({ aiFX: { ...config.aiFX, orbit: v } })} /></div>
                                </>
                            )}
                            {activeSlug === 'software-dev' && (
                                <>
                                    {renderSlider('Points Y', config.softwareFX?.y, -10, 30, 0.1, (v) => setConfig({ softwareFX: { ...config.softwareFX, y: v } }))}
                                    {renderSlider('Points Scale', config.softwareFX?.scale, 0.1, 10, 0.1, (v) => setConfig({ softwareFX: { ...config.softwareFX, scale: v } }))}
                                    <div style={{ alignSelf: 'center' }}><AzimuthDial value={config.softwareFX?.orbit || 0} onChange={(v) => setConfig({ softwareFX: { ...config.softwareFX, orbit: v } })} /></div>
                                </>
                            )}
                            {activeSlug === 'ar-vr' && (
                                <>
                                    {renderSlider('Shape Y', config.arFX?.y, -10, 30, 0.1, (v) => setConfig({ arFX: { ...config.arFX, y: v } }))}
                                    {renderSlider('Distance', config.arFX?.distance, 0, 15, 0.1, (v) => setConfig({ arFX: { ...config.arFX, distance: v } }))}
                                    <div style={{ alignSelf: 'center' }}><AzimuthDial value={config.arFX?.orbit || 0} onChange={(v) => setConfig({ arFX: { ...config.arFX, orbit: v } })} /></div>
                                </>
                            )}
                            {activeSlug === 'gamedev' && (
                                <>
                                    {renderSlider('Blocks Y', config.gamedevFX?.y, -10, 30, 0.1, (v) => setConfig({ gamedevFX: { ...config.gamedevFX, y: v } }))}
                                    {renderSlider('Scale', config.gamedevFX?.scale, 0.1, 10, 0.1, (v) => setConfig({ gamedevFX: { ...config.gamedevFX, scale: v } }))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button onClick={handleSave} disabled={saving} style={{ background: saved ? '#10b981' : '#ffcc00', color: 'black', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : (saved ? <Check size={16} /> : <Save size={16} />)}
                {saving ? 'SAVING...' : (saved ? 'SAVED!' : 'SAVE CONFIG')}
            </button>
        </div>
    );
};

export default StudioEditor;
