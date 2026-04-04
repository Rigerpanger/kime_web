import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useGLTF, Float, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';

const FlashEffect = () => {
    const light = useRef();
    const { activeSlug, sculptureConfig: config } = useAppStore();
    const flashConfig = config.flashFX || { y: 4.8, distance: 1.2, intensity: 40 };
    const [intensity, setIntensity] = useState(0);

    useEffect(() => {
        if (!activeSlug) return;
        setIntensity(flashConfig.intensity || 40);
        const t = setTimeout(() => setIntensity(0), 800);
        return () => clearTimeout(t);
    }, [activeSlug, flashConfig.intensity]);

    useFrame(() => {
        if (!light.current) return;
        light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, intensity, 0.1);
    });

    return (
        <pointLight
            ref={light}
            position={[0, flashConfig.y || 4.8, flashConfig.distance || 1.2]} 
            color="#ffffff"
            distance={20}
            decay={1.8}
        />
    );
};

const NeuralCore = () => {
    const coreRef = useRef();
    const beamsRef = useRef();
    const { sculptureConfig: config } = useAppStore();
    const fx = config.aiFX || { y: 4.8, scale: 1.0, orbit: 0 };
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
        coreRef.current.scale.setScalar((1 + Math.sin(t * 3) * 0.1) * (fx.scale || 1.0));

        if (beamsRef.current) {
            const attr = beamsRef.current.geometry.attributes.position;
            const orbitRad = ((fx.orbit || 0) * Math.PI) / 180;
            const center = new THREE.Vector3(Math.sin(orbitRad) * 0.5, fx.y || 4.8, Math.cos(orbitRad) * 0.5);
            for (let i = 0; i < count; i++) {
                const angle = phases[i] + t * 0.5;
                const r = (2.5 + Math.sin(t + phases[i]) * 1.5) * (fx.scale || 1.0);
                attr.setXYZ(i * 2, center.x, center.y, center.z); 
                attr.setXYZ(i * 2 + 1, center.x + Math.cos(angle) * r, center.y + Math.sin(angle * 2) * r, center.z + Math.sin(angle) * r);
            }
            attr.needsUpdate = true;
        }
    });

    return (
        <group position={[0, (fx.y || 4.8) - 1.5, 0]}> 
            <mesh ref={coreRef} position={[0, 1.5, 0]}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color="#ffcc00" wireframe />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <lineSegments ref={beamsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count * 2} array={beams} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color="#ffaa00" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
            </lineSegments>
        </group>
    );
};

const ShapeShifter = () => {
    const meshRef = useRef();
    const { sculptureConfig: config } = useAppStore();
    const fx = config.arFX || { y: 4.8, scale: 1.0, distance: 3.5, orbit: 0 };
    const [shape, setShape] = useState(0); 
    
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (meshRef.current) {
            const azimuth = ((fx.orbit || 0) * Math.PI) / 180;
            meshRef.current.position.set(Math.sin(azimuth) * (fx.distance || 3.5), fx.y || 4.8, Math.cos(azimuth) * (fx.distance || 3.5));
            meshRef.current.rotation.y = t * 0.5;
            meshRef.current.rotation.z = t * 0.2;
            meshRef.current.scale.setScalar(fx.scale || 1.0);
            meshRef.current.material.wireframe = ((t % 3) / 3) > 0.5;
            meshRef.current.material.opacity = (0.5 + Math.sin(t * 2) * 0.3) * (fx.scale || 1.0);
            if (Math.floor(t / 3) % 4 !== shape) setShape(Math.floor(t / 3) % 3);
        }
    });

    return (
        <mesh ref={meshRef}>
            {shape === 0 ? <boxGeometry args={[2, 2, 2]} /> : shape === 1 ? <sphereGeometry args={[1.5, 32, 32]} /> : <coneGeometry args={[1.5, 2.5, 4]} />}
            <meshBasicMaterial color="#ffaa44" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

const TetrisReveal = ({ onRevealed }) => {
    const { sculptureConfig: config } = useAppStore();
    const fx = config.gamedevFX || { y: 0, scale: 1.0 };
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
        onRevealed(h);
    });

    return (
        <group scale={fx.scale || 1.0} position={[0, fx.y || 0, 0]}>
            {blocks.map((b, i) => (
                <mesh key={b.id} ref={el => meshes.current[i] = el} position={b.pos}>
                    <boxGeometry args={[2.5, 2.5, 2.5]} />
                    <meshBasicMaterial color="#ffaa44" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

const SoftwareSilhouette = ({ targetVertices }) => {
    const pointsRef = useRef();
    const { sculptureConfig: config } = useAppStore();
    const fx = config.softwareFX || { y: 1.5, scale: 1.0, orbit: 0 };
    const count = 3000;
    const timer = useRef(0);

    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) pos[i * 3 + 1] = 20 + Math.random() * 10;
        return [pos];
    }, []);

    useFrame((state, delta) => {
        if (!pointsRef.current || !targetVertices.length) return;
        const attr = pointsRef.current.geometry.attributes.position;
        timer.current += delta;
        const orbitRad = ((fx.orbit || 0) * Math.PI) / 180;
        const offset = [Math.sin(orbitRad) * 5, fx.y || 1.5, Math.cos(orbitRad) * 5];

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const target = targetVertices[i % targetVertices.length].clone().multiplyScalar(fx.scale || 1.0);
            if (timer.current < 5) {
                attr.array[idx] = THREE.MathUtils.lerp(attr.array[idx], target.x + offset[0], 0.05);
                attr.array[idx + 1] = THREE.MathUtils.lerp(attr.array[idx + 1], target.y + offset[1], 0.05);
                attr.array[idx + 2] = THREE.MathUtils.lerp(attr.array[idx + 2], target.z + offset[2], 0.05);
            } else if (timer.current < 10) {
                attr.array[idx] = THREE.MathUtils.lerp(attr.array[idx], target.x + offset[0] + 8, 0.02);
                pointsRef.current.material.opacity = Math.max(0, 1 - (timer.current - 8) / 2);
            } else {
                timer.current = 0; pointsRef.current.material.opacity = 0.8;
                for (let j = 0; j < count; j++) attr.array[j * 3 + 1] = 20 + Math.random() * 10;
            }
        }
        attr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
            <pointsMaterial size={0.25 * (fx.scale || 1.0)} color="#ffaa44" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
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
    const targetVertices = useMemo(() => {
        const verts = [];
        scene.traverse(n => { if (n.isMesh && n.geometry.attributes.position) { 
            const p = n.geometry.attributes.position;
            for (let i = 0; i < p.count; i += 15) verts.push(new THREE.Vector3().fromBufferAttribute(p, i));
        }});
        return verts;
    }, [scene]);

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
                shader.uniforms.uIrisMix.value = activeSlug === 'digital-graphics' ? 1 : 0;
                shader.uniforms.uRevealMix.value = activeSlug === 'gamedev' ? 1 : 0;
                shader.uniforms.uRevealHeight.value = revealHeight;
            }
            if (n.isMesh) {
                n.material.envMapIntensity = config.envMapIntensity ?? 0.02;
                n.material.opacity = activeSlug === 'gamedev' ? 0.4 : 1.0;
                n.material.transparent = activeSlug === 'gamedev';
            }
        });
    });

    return (
        <Float speed={activeSlug === 'gamedev' ? 0.2 : 0.4} rotationIntensity={0.05} floatIntensity={0.1}>
            <Center bottom position={[0, config.y || 0, 0]}>
                <primitive object={clonedScene} scale={config.scale || 1} rotation={[0, (config.rotationY || 0) * (Math.PI / 180), 0]} />
                {(view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) && (
                    <ArtisticIntervention slug={activeSlug} targetVertices={targetVertices} onRevealed={setRevealHeight} />
                )}
                <FlashEffect />
            </Center>
        </Float>
    );
};

const ArtisticIntervention = ({ slug, targetVertices, onRevealed }) => {
    switch (slug) {
        case 'ar-vr': return <ShapeShifter />;
        case 'ai-ml': return <NeuralCore />;
        case 'software-dev': return <SoftwareSilhouette targetVertices={targetVertices} />;
        case 'gamedev': return <TetrisReveal onRevealed={onRevealed} />;
        default: return null;
    }
};

const SmoothLoader = ({ progress }) => {
    const [pseudo, setPseudo] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setPseudo(p => p < 98 ? p + (100-p)*0.01 : p), 200);
        return () => clearInterval(interval);
    }, []);
    const displayProgress = Math.max(progress, pseudo);
    return (
        <Html center>
            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px', textAlign: 'center', letterSpacing: '4px' }}>
                LOADING_ARTIFACT<br/>{Math.round(displayProgress)}%
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
