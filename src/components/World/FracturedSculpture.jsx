import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useGLTF, Float, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';
import useActiveSlug from '../../hooks/useActiveSlug';

// --- HELPERS ---
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
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            ${shader.vertexShader}
        `.replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>\n            vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n            vNormalVec = normalize(normalMatrix * normal);\n            vViewPos = -mvPosition.xyz;\n        `);

        shader.fragmentShader = `
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            uniform float uRevealMix;
            uniform float uRevealY;\n            uniform float uRevealEdge;\n            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>\n            if (uRevealMix > 0.5) {\n                float dist = abs(vWorldPos.y - uRevealY);\n                if (dist > uRevealEdge && vWorldPos.y > uRevealY) discard;\n            }\n        `);
        mat.userData.shader = shader;
    };
    mat.userData.unifiedCompiled = true;
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const activeSlug = useActiveSlug() || 'default';
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setDebug = useAppStore(s => s.setDebug || (() => {}));
    
    const primRef = useRef();
    const groupRef = useRef();
    const stateRef = useRef({ activeSlug, config, showStudioEditor });
    stateRef.current = { activeSlug, config, showStudioEditor };

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; if (n.material) UnifiedShaderInjection(n.material); } });
        return clone;
    }, [scene]);

    useFrame((state, delta = 0.016) => {
        if (!groupRef.current) return;
        const { activeSlug: currentSlug, config: currentConfig, showStudioEditor: isEditing } = stateRef.current;
        if (!currentConfig) return;

        const currentSection = currentConfig.sections?.[currentSlug] || currentConfig.sections?.default || {};
        
        // HARD CLAMP ON Y: Keep it within [-5, 15] for safety
        const rawY = currentSection.modelY ?? currentConfig.y ?? 5.1;
        let tgtY = Math.max(-5, Math.min(15, safeNum(rawY, 5.1)));
        
        let tgtScale = safeNum(currentSection.scale ?? currentConfig.scale, 17.0);
        if (tgtScale < 0.1) tgtScale = 17.0;

        const d = Math.max(0.001, Math.min(0.2, delta));
        const s = isEditing ? 8 : 1.5;

        groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, tgtY, s, d);
        groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, tgtScale, s, d));

        if (setDebug) setDebug({ config: { y: tgtY, scale: tgtScale } });
        
        clonedScene.traverse(n => {
            if (n.isMesh && n.material.userData.shader) {
                const shader = n.material.userData.shader;
                const tetris = (currentSection.fx || []).find(f => f.type === 'TetrisReveal' && f.active);
                shader.uniforms.uRevealMix.value = tetris ? 1.0 : 0.0;
                if (tetris) {
                    const speed = safeNum(tetris.speed, 1.0);
                    shader.uniforms.uRevealY.value = -5 + ((state.clock.elapsedTime * speed * 2.0) % 20);
                    shader.uniforms.uRevealEdge.value = safeNum(tetris.scale, 1.0) * 1.5;
                }
            }
        });
    });

    return (
        <group ref={groupRef}>
            <Center bottom>
                <primitive ref={primRef} object={clonedScene} />
            </Center>
        </group>
    );
};

const SmoothLoader = ({ progress }) => {
    const p = Math.round(progress);
    return (
        <Html fullscreen>
            <div style={{ 
                width: '100vw', height: '100vh', background: '#020202', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}>
                <div style={{ textAlign: 'center', color: 'white', fontFamily: 'monospace' }}>
                    <div style={{ opacity: 0.3, fontSize: '9px', letterSpacing: '4px' }}>SYNCHRONIZING</div>
                    <div style={{ fontSize: '30px', fontWeight: 'bold', margin: '15px 0' }}>{p}%</div>
                    <div style={{ width: '200px', height: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ width: `${p}%`, height: '100%', background: '#ffcc00', transition: 'width 0.3s' }} />
                    </div>
                </div>
            </div>
        </Html>
    );
};

const BrutalistTotem = () => {
    const { progress } = useProgress();
    useEffect(() => {
        window.resetSculpture = () => {
            const st = useAppStore.getState();
            st.setSculptureConfig({ ...st.sculptureConfig, y: 5.1, scale: 17 });
            console.log("Emergency Reset Triggered");
        };
    }, []);

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
