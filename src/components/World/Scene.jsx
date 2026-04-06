import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import useActiveSlug from '../../hooks/useActiveSlug';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import CameraRig from './CameraRig';
import FracturedSculpture from './FracturedSculpture';
import MuseumRoom from './MuseumRoom';
import useAppStore, { VIEWS } from '../../store/useAppStore';
 
// A lighting component for the Studio mode with auto-focus
const StudioLight = ({ light, safeY }) => {
    const targetRef = useRef();
    const lightRef = useRef();
    const angleInRadians = (light.azimuth * Math.PI) / 180;
    const x = light.radius * Math.sin(angleInRadians);
    const z = light.radius * Math.cos(angleInRadians);

    useEffect(() => {
        if (lightRef.current && targetRef.current) {
            lightRef.current.target = targetRef.current;
        }
    }, [light, safeY]);

    return (
        <group>
            <group ref={targetRef} position={[0, safeY + 4.5, 0]} />
            <spotLight
                ref={lightRef}
                position={[x, safeY + light.y, z]}
                intensity={light.intensity}
                color={light.color}
                angle={0.6}
                penumbra={1}
                castShadow
                shadow-bias={-0.0001}
                distance={0}
                decay={0}
            />
        </group>
    );
};

// A refined interactive light system (Flashlight)
const MouseLight = () => {
    const lightRef = useRef(null);
    const coreRef = useRef(null);
    const target = new THREE.Vector3();
    const { view, sculptureConfig: config } = useAppStore();

    useFrame((state) => {
        if (!lightRef.current || !coreRef.current) return;

        // --- 1. Breathing Logic (Fixed 0 during normal interaction) ---
        const glowFactor = 0; 

        // --- 2. World-Space 1:1 Mouse Mapping via Raycast ---
        const targetZ = 4; // Close to sculpture surface
        const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
        vec.unproject(state.camera);
        vec.sub(state.camera.position).normalize();
        
        if (vec.z !== 0) {
            const t = (targetZ - state.camera.position.z) / vec.z;
            target.copy(state.camera.position).add(vec.multiplyScalar(t));
        }
        
        lightRef.current.position.lerp(target, 0.4);
        coreRef.current.position.lerp(target, 0.4);

        // --- 3. Intensity ---
        lightRef.current.intensity = config.mouseLightIntensity !== undefined ? config.mouseLightIntensity : 150;
        coreRef.current.intensity = 0;  // No breathing for now
    });

    return (
        <group>
            {/* The Directed Flashlight - White as requested */}
            <pointLight
                ref={lightRef}
                color="#ffffff" 
                distance={35}
                decay={1.2}
            />
        </group>
    );
};

// --- Global Ambient Particles ---
const GlobalParticles = () => {
    const { sculptureConfig: config } = useAppStore();
    const pointsRef = useRef();
    const count = 2000;
    const opacity = config.bgParticlesIntensity ?? 0.5;

    const pos = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        pointsRef.current.rotation.y += 0.0005;
        pointsRef.current.rotation.x += 0.0002;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.03} color="#ffffff" transparent opacity={opacity * 0.4} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
    );
};

// A component that can "snoop" on the camera's current state and save it
const CameraSnooper = () => {
    const { camera, controls } = useThree();
    const captureTrigger = useAppStore(s => s.captureTrigger);
    const { sculptureConfig: config, showStudioEditor } = useAppStore();
    const activeSlug = useActiveSlug();
    const setSectionView = useAppStore(s => s.setSectionView);
    
    // Fallback detection for manual view changes if needed
    useEffect(() => {
        if (activeSlug) {
            console.log("Scene transition observed:", activeSlug);
        }
    }, [activeSlug]);

    const isFirstRun = useRef(true);
    const lastCaptureTime = useRef(0);

    React.useEffect(() => {
        if (captureTrigger > 0 && controls && showStudioEditor) {
            // DEBOUNCE / SETTLE CHECK: 
            // Don't capture if we just transition slugs (avoid intermediate lerp frames)
            const now = Date.now();
            if (now - lastCaptureTime.current < 200) return;
            lastCaptureTime.current = now;

            const tgt = controls.target;
            const cam = camera;
            
            const rad = Math.max(0.1, cam.position.distanceTo(tgt));
            const dVec = new THREE.Vector3().subVectors(cam.position, tgt);
            
            let pol = (Math.acos(THREE.MathUtils.clamp(dVec.y / rad, -1, 1)) * 180) / Math.PI;
            let azi = (Math.atan2(dVec.x, dVec.z) * 180) / Math.PI;
            
            setSectionView(activeSlug, {
                pivotX: isNaN(tgt.x) ? 0 : tgt.x, 
                pivotY: isNaN(tgt.y) ? 5.1 : tgt.y, 
                pivotZ: isNaN(tgt.z) ? 0 : tgt.z,
                radius: isNaN(rad) ? 18 : rad, 
                polar: isNaN(pol) ? 90 : pol, 
                azimuth: isNaN(azi) ? 0 : azi
            });
        }
    }, [captureTrigger, showStudioEditor]);

    return null;
};



const DebugOverlay = () => {
    const info = useAppStore(s => s.debugInfo);
    if (!info) return null;
    return (
        <div style={{ 
            position: 'fixed', top: 10, left: 10, zIndex: 10000, 
            background: 'rgba(0,0,0,0.8)', color: '#00ff00', padding: '10px', 
            fontFamily: 'monospace', fontSize: '9px', border: '1px solid #444', pointerEvents: 'none' 
        }}>
            <div style={{ color: '#ffcc00', marginBottom: '5px' }}>--- TELEMETRY ---</div>
            <div>CAM: {info.camera.map(v => v.toFixed(2)).join(', ')}</div>
            <div>CFG_Y: {info.config.y.toFixed(2)}</div>
            <div>CFG_SCALE: {info.config.scale.toFixed(2)}</div>
            {info.lastError && (
                <div style={{ color: '#ff0000', marginTop: '5px' }}>ERR: {info.lastError}</div>
            )}
        </div>
    );
};

const Scene = () => {
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setOrbiting = useAppStore(s => s.setOrbiting);
    const triggerCapture = useAppStore(s => s.triggerCapture);
    const isOverPanel = useAppStore(s => s.isOverPanel);
    const activeSlug = useActiveSlug();

    return (
        <ErrorBoundary>
            <DebugOverlay />
            <Canvas 
                shadows 
                camera={{ position: [0, 5, 18], fov: 35 }}
                gl={{ 
                    antialias: true, 
                    powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.7
                }}
                eventSource={document.getElementById('root')}
                eventPrefix="client"
            >
                
                {showStudioEditor && (
                    <OrbitControls 
                        makeDefault 
                        enabled={!isOverPanel}
                        enablePan={true}
                        enableDamping={true}
                        dampingFactor={0.06}
                        onStart={() => setOrbiting(true)}
                        onEnd={() => {
                            setOrbiting(false);
                            triggerCapture(); // Prevents snap-back by saving mouse pos to state
                        }}
                    />
                )}
                {showStudioEditor && <CameraSnooper />}
                
                <CameraRig />

                <color attach="background" args={['#020202']} />
                {!showStudioEditor && (
                    <fog attach="fog" args={['#020202', 20, 100]} />
                )}
                
                {/* --- Dynamic Lighting System: Fixed at 5.1 for model stability --- */}
                {config.lights?.map(light => {
                    const safeY = 5.1 + (config.y || 0);
                    return <StudioLight key={light.id} light={light} safeY={safeY} />;
                })}


                {/* Interactive Flashlight */}
                <MouseLight />
                
                {/* Global Ambient Dust */}
                <GlobalParticles />

                {/* Environment - Wrapped in Suspense so HDRI internet download doesn't freeze the canvas */}
                <Suspense fallback={null}>
                    {config.hdriUrl ? (
                        <Environment files={config.hdriUrl} background={false} blur={0.1} environmentIntensity={0} />
                    ) : (
                        <Environment preset="studio" background={false} blur={0.1} environmentIntensity={0} />
                    )}
                </Suspense>

                {/* --- Museum Room Geometry (Temporarily Disabled by User Request) --- 
                <MuseumRoom /> 
                */}

                <FracturedSculpture />

                {/* Post: Slight bloom for the highlights */}
                <EffectComposer disableNormalPass>
                    <Bloom
                        luminanceThreshold={0.95}
                        mipmapBlur
                        intensity={config.bloomIntensity !== undefined ? config.bloomIntensity : 0.2}
                        radius={config.bloomRadius !== undefined ? config.bloomRadius : 0.2}
                    />
                </EffectComposer>
            </Canvas>
        </ErrorBoundary>
    );
};

export default Scene;
