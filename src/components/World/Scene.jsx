import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';
import CameraRig from './CameraRig';
import FracturedSculpture from './FracturedSculpture';
import MuseumRoom from './MuseumRoom';
import useAppStore, { VIEWS } from '../../store/useAppStore';

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
// A component that can "snoop" on the camera's current state and save it
const CameraSnooper = () => {
    const { camera, controls } = useThree();
    const captureTrigger = useAppStore(s => s.captureTrigger);
    const activeSlug = useAppStore(s => s.activeSlug);
    const setSectionView = useAppStore(s => s.setSectionView);

    React.useEffect(() => {
        if (captureTrigger > 0 && controls) {
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
    }, [captureTrigger]);

    return null;
};

const Scene = () => {
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setOrbiting = useAppStore(s => s.setOrbiting);
    const triggerCapture = useAppStore(s => s.triggerCapture);
    const isOverPanel = useAppStore(s => s.isOverPanel);

    return (
        <ErrorBoundary>
            <Canvas 
                shadows="soft"
                dpr={[1, 2]} 
                gl={{ antialias: true, toneMappingExposure: 0.8 }}
                eventSource={document.getElementById('root')}
                eventPrefix="client"
            >
                <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={35} />
                
                {showStudioEditor && (
                    <OrbitControls 
                        makeDefault 
                        enabled={!isOverPanel}
                        enablePan={true}
                        enableDamping={true}
                        dampingFactor={0.06}
                        onStart={() => setOrbiting(true)}
                        onEnd={() => setOrbiting(false)}
                    />
                )}
                {showStudioEditor && <CameraSnooper />}
                
                <CameraRig />

                <color attach="background" args={['#020202']} />
                <fog attach="fog" args={['#020202', 20, 100]} />


                {/* Interactive Flashlight */}
                <MouseLight />

                {/* Environment - Wrapped in Suspense so HDRI internet download doesn't freeze the canvas */}
                <Suspense fallback={null}>
                    {config.hdriUrl ? (
                        <Environment files={config.hdriUrl} background={false} blur={0.1} environmentIntensity={1} />
                    ) : (
                        <Environment preset="studio" background={false} blur={0.1} environmentIntensity={1} />
                    )}
                </Suspense>

                {/* --- Museum Room Geometry (Temporarily Disabled by User Request) --- 
                <MuseumRoom /> 
                */}

                <Suspense fallback={null}>
                    <FracturedSculpture />
                </Suspense>

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
