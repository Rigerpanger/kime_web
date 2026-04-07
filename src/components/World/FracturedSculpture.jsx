/* [ignoring loop detection] */
import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { useGLTF, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/useAppStore';
import useActiveSlug from '../../hooks/useActiveSlug';

// --- FX MODULES ---
import GeoSwarm from './FX/GeoSwarm';
import NeuralSwarm from './FX/NeuralSwarm';
import NeonEdges from './FX/NeonEdges';
import HoloGrid from './FX/HoloGrid';
import Iris from './FX/Iris';
import NeuralAtom from './FX/NeuralAtom';
import ShapeShifter from './FX/ShapeShifter';
import SoftwareSilhouette from './FX/SoftwareSilhouette';
import QuantumDust from './FX/QuantumDust';
import CyberWaves from './FX/CyberWaves';
import DataStream from './FX/DataStream';

const safeNum = (val, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const UnifiedShaderInjection = (mat) => {
    if (!mat || mat.userData.unifiedCompiled) return;
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uRevealMix = { value: 0 };
        shader.uniforms.uRevealY = { value: 0 };
        shader.uniforms.uRevealEdge = { value: 1.0 };
        
        shader.vertexShader = `
            varying vec3 vWorldPos;
            ${shader.vertexShader}
        `.replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>\n            vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n        `);

        shader.fragmentShader = `
            varying vec3 vWorldPos;\n            uniform float uRevealMix;\n            uniform float uRevealY;\n            uniform float uRevealEdge;\n            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>\n            if (uRevealMix > 0.5) {\n                float dist = abs(vWorldPos.y - uRevealY);\n                if (dist > uRevealEdge && vWorldPos.y > uRevealY) discard;\n            }\n        `);
        mat.userData.shader = shader;
        mat.userData.unifiedCompiled = true;
    };
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb', 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
    const activeSlug = useActiveSlug() || 'default';
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    
    const groupRef = useRef();
    const stateRef = useRef({ activeSlug, config, showStudioEditor });
    stateRef.current = { activeSlug, config, showStudioEditor };

    const { sceneOffset, clonedScene } = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { 
            if (n.isMesh) { 
                n.castShadow = true; 
                n.receiveShadow = true; 
                if (n.material) UnifiedShaderInjection(n.material); 
            } 
        });

        // Manual Centering: Compute the Bounding Box
        const box = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Offset to bring the model's center to [0, h/2, 0] and bottom to 0
        const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);

        return { sceneOffset: offset, clonedScene: clone };
    }, [scene]);

    const currentSection = config.sections?.[activeSlug] || config.sections?.default || {};
    const activeFXs = currentSection.fx || [];

    useFrame((state, delta = 0.016) => {
        if (!groupRef.current) return;
        const { config: currentConfig, showStudioEditor: isEditing } = stateRef.current;
        if (!currentConfig) return;

        const orbitRad = currentSection.orbitRadius ?? currentConfig.orbitRadius ?? 0.0;
        const orbitAzi = ((currentSection.orbitAzimuth ?? currentConfig.orbitAzimuth ?? 0) * (Math.PI / 180));
        const tgtY = 5.1 + (currentSection.modelY ?? currentConfig.y ?? 0);
        const tgtScale = ((currentSection.scale ?? currentConfig.scale ?? 170) / 10);

        const d = Math.max(0.001, Math.min(0.2, delta));
        const s = isEditing ? 12 : 1.5;

        // Anchor the sculpture at the center
        groupRef.current.position.x = 0;
        groupRef.current.position.z = 0;
        groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, tgtY, s, d);
        groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, tgtScale, s, d));

        // The FX group will respond to orbit parameters (rotation)
        if (groupRef.current.children[1]) {
            const fxGroup = groupRef.current.children[1];
            fxGroup.rotation.y = THREE.MathUtils.damp(fxGroup.rotation.y, orbitAzi, s, d);
        }

        clonedScene.traverse(n => {
            if (n.isMesh && n.material.userData.shader) {
                const shader = n.material.userData.shader;
                const tetris = activeFXs.find(f => f.type === 'TetrisReveal' && f.active);
                shader.uniforms.uRevealMix.value = tetris ? 1.0 : 0.0;
                if (tetris) {
                    const spd = safeNum(tetris.speed, 1.0);
                    shader.uniforms.uRevealY.value = -5 + ((state.clock.elapsedTime * spd * 2.0) % 20);
                    shader.uniforms.uRevealEdge.value = safeNum(tetris.scale, 1.0) * 1.5;
                }
            }
        });
    });

    return (
        <group>
            <group ref={groupRef}>
                {/* 1. Main Sculpture and its FX in a single pivoted group */}
                <group position={sceneOffset}>
                    <primitive object={clonedScene} />

                    {/* 2. FX Sub-group that can rotate independently around the anchored model */}
                    <group>
                        {activeFXs.map(fx => {
                            if (!fx.active) return null;
                            const key = fx.id || fx.type;
                            const modelY = 5.1 + (config.y || 0);
                            const orbitRad = currentSection.orbitRadius ?? config.orbitRadius ?? 0;

                            switch(fx.type) {
                                case 'GeoSwarm': return <GeoSwarm key={key} config={{...fx, radius: (fx.radius ?? 2) + orbitRad}} modelY={modelY} />;
                                case 'NeuralSwarm': return <NeuralSwarm key={key} config={{...fx, radius: (fx.radius ?? 2.5) + orbitRad}} modelY={modelY} />;
                                case 'NeonEdges': return <NeonEdges key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                                case 'HoloGrid': return <HoloGrid key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                                case 'Iris': return <Iris key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                                case 'NeuralAtom': return <NeuralAtom key={key} config={{...fx, radius: (fx.radius ?? 1.1) + orbitRad}} modelY={modelY} />;
                                case 'ShapeShifter': return <ShapeShifter key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                                case 'SoftwareSilhouette': return <SoftwareSilhouette key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                                case 'QuantumDust': return <QuantumDust key={key} config={{...fx, radius: (fx.radius ?? 6.0) + orbitRad}} modelY={modelY} />;
                                case 'CyberWaves': return <CyberWaves key={key} config={{...fx, radius: (fx.radius ?? 4.0) + orbitRad}} modelY={modelY} />;
                                case 'DataStream': return <DataStream key={key} config={{...fx, radius: (fx.radius ?? 2.5) + orbitRad}} modelY={modelY} />;
                                default: return null;
                            }
                        })}
                    </group>
                </group>
            </group>
        </group>
    );
};

const SmoothLoader = ({ progress }) => (
    <Html fullscreen>
        <div style={{ width: '100vw', height: '100vh', background: '#020202', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ textAlign: 'center', color: 'white', fontFamily: 'monospace' }}>
                <div style={{ opacity: 0.3, fontSize: '9px', letterSpacing: '4px' }}>SYNCHRONIZING</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', margin: '15px 0' }}>{Math.round(progress)}%</div>
                <div style={{ width: '200px', height: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#ffcc00', transition: 'width 0.3s' }} />
                </div>
            </div>
        </div>
    </Html>
);

const BrutalistTotem = () => {
    const { progress } = useProgress();
    return (
        <group>
            <Suspense fallback={<SmoothLoader progress={progress} />}>
                <SculptureModel />
                <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={20} blur={2.5} far={10} color="#000000" />
            </Suspense>
        </group>
    );
};

export default BrutalistTotem;
