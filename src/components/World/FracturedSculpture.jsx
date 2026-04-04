import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useGLTF, Float, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';

// FX Components Dictionary
const FX_COMPONENTS = {
    'NeuralCore': (props) => <NeuralCore {...props} />,
    'ShapeShifter': (props) => <ShapeShifter {...props} />,
    'SoftwareSilhouette': (props) => <SoftwareSilhouette {...props} />,
    'TetrisReveal': (props) => <TetrisReveal {...props} />,
    'Iris': () => null,
    'None': () => null
};

// Wrapper for transition logic
const FXWrapper = ({ type, config, isActive, onRevealed }) => {
    const opacityRef = useRef(0);
    const FXComp = FX_COMPONENTS[type];
    
    useFrame((state, delta) => {
        const target = isActive ? 1.0 : 0.0;
        opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, delta * 2.0);
    });

    if (opacityRef.current < 0.01 && !isActive) return null;
    if (!FXComp) return null;

    // Pass the calculated animated opacity to the component
    // Note: Each component must respect this 'animatedOpacity'
    return <FXComp config={config} animatedOpacity={opacityRef.current} onRevealed={onRevealed} />;
};

// --- EFFECT: AI (NeuralCore) ---
const NeuralCore = ({ config = {}, animatedOpacity = 1 }) => {
    const coreRef = useRef();
    const beamsRef = useRef();
    const count = 15;
    
    const [beams, phases] = useMemo(() => {
        const positions = new Float32Array(count * 2 * 3);
        const phs = new Float32Array(count);
        for (let i = 0; i < count; i++) phs[i] = Math.random() * Math.PI * 2;
        return [positions, phs];
    }, []);

    useFrame((state) => {
        if (!coreRef.current) return;
        const t = state.clock.elapsedTime;
        coreRef.current.rotation.y += 0.02;
        coreRef.current.rotation.z += 0.01;
        coreRef.current.scale.setScalar((1 + Math.sin(t * 3) * 0.1) * (config.scale || 1.0));

        if (beamsRef.current) {
            const attr = beamsRef.current.geometry.attributes.position;
            const center = new THREE.Vector3().fromArray(config.pos || [0, 4.8, 0]);
            for (let i = 0; i < count; i++) {
                const angle = phases[i] + t * 0.5;
                const r = (2.5 + Math.sin(t + phases[i]) * 1.5) * (config.scale || 1.0);
                attr.setXYZ(i * 2, center.x, center.y, center.z); 
                attr.setXYZ(i * 2 + 1, center.x + Math.cos(angle) * r, center.y + Math.sin(angle * 2) * r, center.z + Math.sin(angle) * r);
            }
            attr.needsUpdate = true;
        }
    });

    return (
        <group position={[0, -1.5, 0]}> 
            <mesh ref={coreRef} position={config.pos || [0, 4.8, 0]}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color={config.color || "#ffcc00"} wireframe transparent opacity={animatedOpacity} />
            </mesh>
            <mesh position={config.pos || [0, 4.8, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={animatedOpacity} />
            </mesh>
            <lineSegments ref={beamsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count * 2} array={beams} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={config.color || "#ffaa00"} transparent opacity={0.6 * (config.intensity || 1.0) * animatedOpacity} blending={THREE.AdditiveBlending} />
            </lineSegments>
        </group>
    );
};

// --- EFFECT: ShapeShifter ---
const ShapeShifter = ({ config = {}, animatedOpacity = 1 }) => {
    const meshRef = useRef();
    const [shape, setShape] = useState(0); 
    
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (meshRef.current) {
            meshRef.current.position.set(...(config.pos || [0, 4.8, 3.5]));
            meshRef.current.rotation.y = t * 0.5;
            meshRef.current.scale.setScalar(config.scale || 1.0);
            meshRef.current.material.opacity = (0.5 + Math.sin(t * 2) * 0.3) * (config.intensity || 1.0) * animatedOpacity;
            if (Math.floor(t / 3) % 4 !== shape) setShape(Math.floor(t / 3) % 3);
        }
    });

    return (
        <mesh ref={meshRef}>
            {shape === 0 ? <boxGeometry args={[2 * (config.scale || 1), 2 * (config.scale || 1), 2 * (config.scale || 1)]} /> : 
             shape === 1 ? <sphereGeometry args={[1.5 * (config.scale || 1), 32, 32]} /> : 
             <coneGeometry args={[1.5 * (config.scale || 1), 2.5 * (config.scale || 1), 4]} />}
            <meshBasicMaterial color={config.color || "#ffaa44"} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

// --- EFFECT: Gamedev Reveal ---
const TetrisReveal = ({ config = {}, animatedOpacity = 1, onRevealed }) => {
    const [blocks, setBlocks] = useState([]);
    const meshes = useRef([]);
    const landedCount = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBlocks(prev => {
                if (prev.length >= 6) return prev;
                return [...prev, { id: Math.random(), pos: [ (Math.random() - 0.5) * 4, 15, (Math.random() - 0.5) * 4 ], speed: 0.15, landed: false }];
            });
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    useFrame(() => {
        let currentLanded = 0;
        blocks.forEach((b, i) => {
            const mesh = meshes.current[i];
            if (!mesh) return;
            if (!b.landed) {
                mesh.position.y -= b.speed;
                if (mesh.position.y <= -2) {
                    b.landed = true;
                    landedCount.current++;
                }
            } else {
                mesh.position.y = -2;
                currentLanded++;
            }
        });
        const h = -5 + (currentLanded * (17 / 6));
        if (onRevealed) onRevealed(h);
    });

    return (
        <group scale={config.scale || 1.0} position={config.pos || [0, 0, 0]}>
            {blocks.map((b, i) => (
                <mesh key={b.id} ref={el => meshes.current[i] = el} position={b.pos}>
                    <boxGeometry args={[2.5, 2.5, 2.5]} />
                    <meshBasicMaterial color={config.color || "#ffaa44"} transparent opacity={0.7 * (config.intensity || 1.0) * animatedOpacity} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

// --- EFFECT: Software Silhouette ---
const SoftwareSilhouette = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 3000;
    const timer = useRef(0);

    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const center = config.pos || [0, 1.5, 0];
        for (let i = 0; i < count; i++) {
            pos[i * 3] = center[0] + (Math.random() - 0.5) * 5;
            pos[i * 3 + 1] = center[1] + 20 + Math.random() * 10;
            pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * 5;
        }
        return [pos];
    }, [config.pos]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const attr = pointsRef.current.geometry.attributes.position;
        timer.current += delta;
        const center = config.pos || [0, 1.5, 0];

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const moveAmt = 0.05 * (config.scale || 1.0);
            if (timer.current < 5) {
                attr.array[idx + 1] -= moveAmt; 
                if (attr.array[idx + 1] < center[1] - 5) attr.array[idx + 1] = center[1] + 15;
            } else {
                timer.current = 0;
            }
        }
        attr.needsUpdate = true;
        pointsRef.current.material.opacity = (0.5 + Math.sin(state.clock.elapsedTime) * 0.2) * (config.intensity || 1.0) * animatedOpacity;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
            <pointsMaterial size={0.2 * (config.scale || 1.0)} color={config.color || "#ffaa44"} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </points>
    );
};

const UnifiedShaderInjection = (mat) => {
    if (mat.userData.unifiedCompiled) return;
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uIrisMix = { value: 0 };
        shader.uniforms.uRevealMix = { value: 0 };
        shader.uniforms.uRevealHeight = { value: 15 };
        
        shader.vertexShader = `
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            ${shader.vertexShader}
        `.replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>
            vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            vNormalVec = normalize(normalMatrix * normal);
            vViewPos = -mvPosition.xyz;
        `);

        shader.fragmentShader = `
            uniform float uTime;
            uniform float uIrisMix;
            uniform float uRevealMix;
            uniform float uRevealHeight;
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>
            if (uRevealMix > 0.5 && vWorldPos.y > uRevealHeight) discard;
        `).replace(`#include <color_fragment>`, `#include <color_fragment>
            float fresnel = 1.0 - max(0.0, dot(normalize(vNormalVec), normalize(vViewPos)));
            vec3 iris = vec3(sin(vNormalVec.x*5.0+uTime)*0.5+0.5, sin(vNormalVec.y*5.0+uTime+2.0)*0.5+0.5, sin(vNormalVec.z*5.0-uTime+4.0)*0.5+0.5);
            iris = mix(vec3(1.0), iris, smoothstep(0.0, 1.0, fresnel));
            diffuseColor.rgb = mix(diffuseColor.rgb, iris, uIrisMix * 0.8);
        `);
        mat.userData.shader = shader;
    };
    mat.userData.unifiedCompiled = true;
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb');
    const { sculptureConfig: config, activeSlug, view } = useAppStore();
    const [revealHeight, setRevealHeight] = useState(15);

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { if (n.isMesh) UnifiedShaderInjection(n.material); });
        return clone;
    }, [scene]);

    useFrame((state) => {
        clonedScene.traverse(n => {
            const shader = n.material?.userData?.shader;
            if (shader) {
                shader.uniforms.uTime.value = state.clock.elapsedTime;
                shader.uniforms.uIrisMix.value = activeSlug === 'digital-graphics' ? 1.0 : 0;
                shader.uniforms.uRevealMix.value = activeSlug === 'gamedev' ? 1.0 : 0;
                shader.uniforms.uRevealHeight.value = revealHeight;
            }
            if (n.isMesh) {
                n.material.envMapIntensity = config.envMapIntensity ?? 0.02;
                n.material.opacity = activeSlug === 'gamedev' ? 0.4 : 1.0;
                n.material.transparent = activeSlug === 'gamedev';
            }
        });
    });

    const isServiceView = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;

    return (
        <Float speed={0.4} rotationIntensity={0.05} floatIntensity={0.1}>
            <Center bottom position={[0, config.y || 0, 0]}>
                <primitive object={clonedScene} scale={config.scale || 1} rotation={[0, (config.rotationY || 0) * (Math.PI / 180), 0]} />
                
                {/* Render ALL section FX for smooth transitions */}
                {Object.entries(config.sections || {}).map(([slug, section]) => (
                    section.fx.map((fx, idx) => (
                        <FXWrapper 
                            key={`${slug}-${idx}`}
                            type={fx.type}
                            config={fx}
                            isActive={isServiceView && activeSlug === slug && fx.active}
                            onRevealed={setRevealHeight}
                        />
                    ))
                ))}
            </Center>
        </Float>
    );
};

const SmoothLoader = ({ progress }) => {
    const [pseudo, setPseudo] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setPseudo(p => p < 98 ? p + (100-p)*0.01 : p), 200);
        return () => clearInterval(interval);
    }, []);
    return (
        <Html center>
            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px', textAlign: 'center', letterSpacing: '4px' }}>
                LOADING_ARTIFACT<br/>{Math.round(Math.max(progress, pseudo))}%
            </div>
        </Html>
    );
};

const BrutalistTotem = () => {
    const { progress } = useProgress();
    return (
        <group>
            <Suspense fallback={<SmoothLoader progress={progress} />}>
                <SculptureModel />
                <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={20} blur={2.5} far={10} color="#000000" />
            </Suspense>
            <pointLight position={[0, 1.5, 0]} intensity={0.02} color="#ffaa00" distance={10} decay={2} />
        </group>
    );
};

useGLTF.preload('/models/sculpture.glb');
export default BrutalistTotem;
