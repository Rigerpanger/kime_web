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
import MilkyWay from './FX/MilkyWay';

const safeNum = (val, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const UnifiedShaderInjection = (mat) => {
    if (!mat || mat.userData.unifiedCompiled) return;
    mat.onBeforeCompile = (shader) => {
        // Uniforms for Reveal and Iris
        shader.uniforms.uRevealMix = mat.userData.uRevealMix = { value: 0 };
        shader.uniforms.uRevealY = mat.userData.uRevealY = { value: 0 };
        shader.uniforms.uRevealEdge = mat.userData.uRevealEdge = { value: 1.0 };

        shader.uniforms.uIrisMix = mat.userData.uIrisMix = { value: 0 };
        shader.uniforms.uIrisColor = mat.userData.uIrisColor = { value: new THREE.Color('#00f2ff') };
        shader.uniforms.uIrisTime = mat.userData.uIrisTime = { value: 0 };
        shader.uniforms.uIrisIntensity = mat.userData.uIrisIntensity = { value: 1.0 };
        shader.uniforms.uIrisMode = mat.userData.uIrisMode = { value: 0 };
        shader.uniforms.uIrisOffset = mat.userData.uIrisOffset = { value: 0.8 };
        shader.uniforms.uIrisBrightness = mat.userData.uIrisBrightness = { value: 1.0 };
        shader.uniforms.uIrisGloss = mat.userData.uIrisGloss = { value: 1.0 };
        
        shader.vertexShader = `
            varying vec3 vIrisWorldPos;
            varying vec3 vIrisViewVec;
            uniform float uIrisMix;
            uniform float uIrisMode;
            uniform float uIrisOffset;
            ${shader.vertexShader}
        `.replace(`#include <worldpos_vertex>`, `
            #include <worldpos_vertex>
            vIrisWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            vIrisViewVec = normalize(cameraPosition - vIrisWorldPos);

            // Spectral Displacement Logic
            if (uIrisMix > 0.1 && uIrisMode > 3.5) {
                float shift = uIrisOffset * 0.1;
                transformed += normal * shift;
            }
        `);

        shader.fragmentShader = `
            varying vec3 vIrisWorldPos;
            varying vec3 vIrisViewVec;
            uniform float uRevealMix;
            uniform float uRevealY;
            uniform float uRevealEdge;
            uniform float uIrisMix;
            uniform vec3 uIrisColor;
            uniform float uIrisTime;
            uniform float uIrisIntensity;
            uniform float uIrisMode;
            uniform float uIrisBrightness;
            uniform float uIrisGloss;

            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `
            #include <clipping_planes_fragment>
            if (uRevealMix > 0.5) {
                float dist = abs(vIrisWorldPos.y - uRevealY);
                if (dist > uRevealEdge && vIrisWorldPos.y > uRevealY) discard;
            }
        `).replace(`#include <dithering_fragment>`, `
            #include <dithering_fragment>
            if (uIrisMix > 0.01) {
                vec3 norm = normalize(vNormal);
                float vDotV = abs(dot(norm, vIrisViewVec));
                float fMode = uIrisMode;
                vec3 finalEffect = vec3(0.0);

                if (fMode < 4.0) {
                    finalEffect = uIrisColor * pow(1.0 - vDotV, 3.0);
                } else {
                    // SPECTRAL MODE (Golden Formula Restored)
                    float t = uIrisTime * 0.15;
                    vec3 spectralCol = 0.5 + 0.5 * cos(t + vec3(0.0, 2.0, 4.0) + vIrisWorldPos.y * 4.0);
                    float rim = pow(max(1.0 - vDotV, 0.0), 3.0 / max(uIrisGloss, 0.1));
                    finalEffect = spectralCol * rim * 2.0 * uIrisBrightness;
                }
                gl_FragColor.rgb += finalEffect * uIrisIntensity;
            }
        `);
        mat.userData.shader = shader;
        mat.userData.unifiedCompiled = true;
    };
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const activeSlug = useActiveSlug() || 'default';
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    
    const groupRef = useRef();
    const stateRef = useRef({ activeSlug, config, showStudioEditor });
    stateRef.current = { activeSlug, config, showStudioEditor };

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; if (n.material) UnifiedShaderInjection(n.material); } });
        return clone;
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

        // Levitation (Float) logic
        const levitation = activeFXs.find(f => f.type === 'Levitation' && f.active);
        let floatY = 0;
        if (levitation) {
            const fSpd = safeNum(levitation.speed, 1.0);
            const fInt = safeNum(levitation.intensity, 1.0);
            floatY = Math.sin(state.clock.elapsedTime * fSpd * 0.8) * 0.15 * fInt;
        }

        groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, tgtY + floatY, s, d);
        groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, tgtScale, s, d));

        if (groupRef.current.children[1]) {
            const fxGroup = groupRef.current.children[1];
            fxGroup.rotation.y = THREE.MathUtils.damp(fxGroup.rotation.y, orbitAzi, s, d);
        }

        clonedScene.traverse(n => {
            if (n.isMesh && n.material.userData.shader) {
                const shader = n.material.userData.shader;
                const ud = n.material.userData;
                const iris = activeFXs.find(f => f.type === 'Iris' && f.active);

                if (iris) {
                    shader.uniforms.uIrisMix.value = 1.0;
                    shader.uniforms.uIrisTime.value = state.clock.elapsedTime * safeNum(iris.speed, 1.0);
                    shader.uniforms.uIrisIntensity.value = safeNum(iris.intensity, 1.0);
                    shader.uniforms.uIrisBrightness.value = safeNum(iris.brightness, 1.0);
                    shader.uniforms.uIrisGloss.value = safeNum(iris.gloss, 1.0);
                    shader.uniforms.uIrisOffset.value = safeNum(iris.offset, 0.8);
                    shader.uniforms.uIrisMode.value = (iris.mode === 'Spectral' || iris.presetIndex === 4) ? 4.1 : 0.0;
                } else {
                    shader.uniforms.uIrisMix.value = 0.0;
                }

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
                <Center bottom>
                    <primitive object={clonedScene} />
                </Center>

                {/* 2. FX Sub-group that can rotate independently around the anchored model */}
                <group>
                    {activeFXs.map(fx => {
                        if (!fx.active) return null;
                        const key = fx.id || fx.type;
                        const modelY = 5.1 + (config.y || 0);
                        const orbitRad = currentSection.orbitRadius ?? config.orbitRadius ?? 0;

                        switch(fx.type) {
                            case 'GeoSwarm': return <GeoSwarm key={key} config={{...fx, radius: (fx.radius || 3) + orbitRad}} modelY={modelY} />;
                            case 'NeuralSwarm': return <NeuralSwarm key={key} config={{...fx, radius: (fx.radius || 4) + orbitRad}} modelY={modelY} />;
                            case 'NeonEdges': return <NeonEdges key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                            case 'HoloGrid': return <HoloGrid key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                            case 'Iris': return <Iris key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                            case 'NeuralAtom': return <NeuralAtom key={key} config={{...fx, radius: (fx.radius || 1.5) + orbitRad}} modelY={modelY} />;
                            case 'ShapeShifter': return <ShapeShifter key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                            case 'SoftwareSilhouette': return <SoftwareSilhouette key={key} scene={clonedScene} config={fx} modelY={modelY} />;
                            case 'QuantumDust': return <QuantumDust key={key} config={{...fx, radius: (fx.radius || 8.0) + orbitRad * 2}} modelY={modelY} />;
                            case 'CyberWaves': return <CyberWaves key={key} config={{...fx, radius: (fx.radius || 5.0) + orbitRad}} modelY={modelY} />;
                            case 'DataStream': return <DataStream key={key} config={{...fx, radius: (fx.radius || 3.0) + orbitRad}} modelY={modelY} />;
                            case 'MilkyWay': return <MilkyWay key={key} config={fx} />;
                            default: return null;
                        }
                    })}
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
