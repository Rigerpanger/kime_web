import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useGLTF, Float, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';
import useActiveSlug from '../../hooks/useActiveSlug';

const FX_COMPONENTS = {
    'NeuralAtom': (props) => <NeuralAtom {...props} />,
    'NeuralSwarm': (props) => <NeuralSwarm {...props} />,
    'ShapeShifter': (props) => <ShapeShifter {...props} />,
    'SoftwareSilhouette': (props) => <SoftwareSilhouette {...props} />,
    'TetrisReveal': (props) => <TetrisReveal {...props} />,
    'QuantumDust': (props) => <QuantumDust {...props} />,
    'CyberWaves': (props) => <CyberWaves {...props} />,
    'DataStream': (props) => <DataStream {...props} />,
    'GeoSwarm': (props) => <GeoSwarm {...props} />,
    'HoloGrid': () => null,
    'NeonEdges': () => null,
    'Iris': () => null,
    'None': () => null
};

// A spotlight that stays focused on the model group
// Wrapper for positioning and transition logic
const FXWrapper = ({ type, config, isActive, onRevealed }) => {
    const opacityRef = useRef(isActive ? 1.0 : 0.0);
    const FXComp = FX_COMPONENTS[type];
    
    useFrame((state, delta) => {
        const target = isActive ? 1.0 : 0.0;
        // SNAPPY FADE: 8.0 instead of 2.0 (4x faster)
        opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, delta * 8.0);
    });

    if (opacityRef.current < 0.01 && !isActive) return null;
    if (!FXComp) return null;

    // --- ORBITAL POSITIONING LOGIC ---
    // Spatial FX: NeuralAtom, NeuralSwarm, ShapeShifter, SoftwareSilhouette, TetrisReveal
    // Non-Spatial FX: Iris (Shader-only)
    const isSpatial = ['NeuralAtom', 'NeuralSwarm', 'ShapeShifter', 'SoftwareSilhouette', 'TetrisReveal'].includes(type);
    
    let position = [0, 4.8, 0];
    if (isSpatial) {
        const azimuth = (config.azimuth || 0) * Math.PI / 180;
        const radius = config.radius !== undefined ? config.radius : 4.5;
        const height = config.height !== undefined ? config.height : 4.8;
        
        position = [
            radius * Math.sin(azimuth),
            height,
            radius * Math.cos(azimuth)
        ];
    }
 else {
        // Fallback for non-spatial or legacy
        position = Array.isArray(config.pos) ? config.pos : [0, 0, 0];
    }

    return (
        <group position={position}>
            <FXComp config={config} animatedOpacity={opacityRef.current} onRevealed={onRevealed} />
        </group>
    );
};

// --- EFFECT: Neural Atom (AI Core) ---
const NeuralAtom = ({ config = {}, animatedOpacity = 1 }) => {
    const coreRef = useRef();
    const wireRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.speed || 1.0);
        if (coreRef.current) {
            const behavior = config.behavior || 'Orbit';
            if (behavior === 'Pulse') {
                coreRef.current.scale.setScalar((1 + Math.sin(t * 4) * 0.2) * (config.scale || 1.0));
            } else if (behavior === 'Glitch') {
                const s = 1.0 + (Math.random() > 0.9 ? 0.2 : 0);
                coreRef.current.scale.setScalar(s * (config.scale || 1.0));
            } else { // Orbit
                coreRef.current.rotation.y = t * 0.5;
                coreRef.current.rotation.z = t * 0.3;
                coreRef.current.scale.setScalar(config.scale || 1.0);
            }
        }
        if (wireRef.current) {
            wireRef.current.rotation.y = -t * 0.8;
        }
    });

    return (
        <group>
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color={config.color || "#ffcc00"} transparent opacity={animatedOpacity * (config.intensity ?? 1.0)} />
            </mesh>
            <mesh ref={wireRef} scale={1.2}>
                <icosahedronGeometry args={[0.6, 1]} />
                <meshBasicMaterial color={config.wireColor || "#ffffff"} wireframe transparent opacity={animatedOpacity * 0.4} />
            </mesh>
        </group>
    );
};

// --- EFFECT: Neural Swarm (Energy Particles) ---
const NeuralSwarm = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 400;

    const particles = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const data = new Float32Array(count); 
        for (let i = 0; i < count; i++) {
            data[i] = Math.random();
            pos[i*3] = (Math.random() - 0.5) * 10;
            pos[i*3+1] = (Math.random() - 0.5) * 10;
            pos[i*3+2] = (Math.random() - 0.5) * 10;
        }
        return { pos, data };
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.speed || 1.0);
        const behavior = config.behavior || 'Orbit';
        const positions = pointsRef.current.geometry.attributes.position.array;
        
        for (let i = 0; i < count; i++) {
            const pIdx = i * 3;
            const seed = particles.data[i];
            
            if (behavior === 'Flow') {
                positions[pIdx+1] += Math.sin(t + seed * 10) * 0.02;
                positions[pIdx] += Math.cos(t * 0.5 + seed * 5) * 0.01;
            } else if (behavior === 'Chaos') {
                positions[pIdx] += (Math.random() - 0.5) * 0.05;
                positions[pIdx+1] += (Math.random() - 0.5) * 0.05;
                positions[pIdx+2] += (Math.random() - 0.5) * 0.05;
            } else { // Orbit
                const r = 3 + seed * 2;
                const angle = t * 0.5 + seed * 100;
                positions[pIdx] = Math.cos(angle) * r;
                positions[pIdx+2] = Math.sin(angle) * r;
                positions[pIdx+1] = Math.sin(angle * 0.5) * 2;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.material.opacity = animatedOpacity * (config.intensity || 1.0);
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles.pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.12 * (config.scale || 1.0)} color={config.color || "#ffcc00"} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

// --- EFFECT: ShapeShifter (Morphing Geometry) ---
const ShapeShifter = ({ config = {}, animatedOpacity = 1 }) => {
    const meshRef = useRef();
    const [shape, setShape] = useState(0); 
    
    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.speed || 1.0);
        const behavior = config.behavior || 'Pulse';
        
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.5;
            
            if (behavior === 'Glitch') {
                meshRef.current.position.x = Math.random() > 0.95 ? (Math.random()-0.5) : 0;
            } else if (behavior === 'Float') {
                meshRef.current.position.y = Math.sin(t) * 0.5;
            }
            
            meshRef.current.scale.setScalar(config.scale || 1.0);
            meshRef.current.material.opacity = (0.5 + Math.sin(t * 2) * 0.3) * (config.intensity || 1.0) * animatedOpacity;
            if (Math.floor(t / 2) % 3 !== shape) setShape(Math.floor(t / 2) % 3);
        }
    });

    const isPoints = config.mode === 'Points';
    const isWire = config.mode === 'Wireframe';

    return (
        <group>
            {isPoints ? (
                <points ref={meshRef}>
                    {shape === 0 ? <boxGeometry args={[2.5, 2.5, 2.5, 8, 8, 8]} /> : 
                     shape === 1 ? <sphereGeometry args={[1.8, 16, 16]} /> : 
                     <icosahedronGeometry args={[2, 2]} />}
                    <pointsMaterial color={config.color || "#ffaa44"} size={0.05} transparent opacity={animatedOpacity} />
                </points>
            ) : (
                <mesh ref={meshRef}>
                    {shape === 0 ? <boxGeometry args={[2, 2, 2]} /> : 
                     shape === 1 ? <sphereGeometry args={[1.5, 32, 32]} /> : 
                     <coneGeometry args={[1.5, 2.5, 4]} />}
                    <meshBasicMaterial color={config.color || "#ffaa44"} transparent wireframe={isWire} opacity={0.8} blending={THREE.AdditiveBlending} />
                </mesh>
            )}
        </group>
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

    const safePos = Array.isArray(config.pos) ? config.pos : [0, 0, 0];
    return (
        <group scale={config.scale || 1.0}>
            {blocks.map((b, i) => (
                <mesh key={b.id} ref={el => meshes.current[i] = el} position={b.pos}>
                    <boxGeometry args={[2.5, 2.5, 2.5]} />
                    <meshBasicMaterial color={config.color || "#ffaa44"} transparent opacity={0.7 * (config.intensity || 1.0) * animatedOpacity} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

// --- EFFECT: Software Silhouette (Matrix/Data Rain) ---
const SoftwareSilhouette = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 800;
    
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const data = new Float32Array(count * 3); // speed, offset, lane
        
        for(let i=0; i<count; i++) {
            data[i*3] = 0.5 + Math.random(); // speed
            data[i*3+1] = Math.random() * Math.PI * 2; // offset
            data[i*3+2] = 4.0 + Math.random() * 4.0; // lane
            
            pos[i*3+1] = (Math.random() - 0.5) * 12.0;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aData', new THREE.BufferAttribute(data, 3));
        return geo;
    }, []);

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 },
                uColor1: { value: new THREE.Color("#00ff66") },
                uColor2: { value: new THREE.Color("#0088ff") },
                uScale: { value: 1.0 },
                uBehavior: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uScale;
                uniform float uBehavior;
                attribute vec3 aData;
                varying float vData;
                void main() {
                    float speed = aData.x;
                    float offset = aData.y;
                    float lane = aData.z;
                    vec3 p = position;
                    
                    float t = uTime * speed * (uBehavior > 0.5 ? 2.0 : 0.5);
                    float angle = offset + uTime * 0.2;
                    
                    if (uBehavior < 0.5) { // Rain
                        p.y = mod(p.y - t, 12.0) - 6.0;
                    } else if (uBehavior < 1.5) { // Orbit
                        p.x = cos(angle) * lane;
                        p.z = sin(angle) * lane;
                    } else { // Static
                        p.x += sin(uTime + offset) * 0.2;
                    }
                    
                    vData = fract(p.y * 0.1 + uTime);
                    vec4 mvPosition = modelViewMatrix * vec4(p * uScale, 1.0);
                    gl_PointSize = (20.0 * uScale / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uOpacity;
                uniform vec3 uColor1; uniform vec3 uColor2;
                varying float vData;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    if (d > 0.5) discard;
                    vec3 col = mix(uColor1, uColor2, vData);
                    gl_FragColor = vec4(col, uOpacity * (1.0 - d * 2.0));
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
            pointsRef.current.material.uniforms.uOpacity.value = animatedOpacity * (config.intensity || 1.0);
            pointsRef.current.material.uniforms.uScale.value = config.scale || 1.0;
            pointsRef.current.material.uniforms.uColor1.value.set(config.color || "#00ff66");
            pointsRef.current.material.uniforms.uColor2.value.set(config.color2 || "#0088ff");
            pointsRef.current.material.uniforms.uBehavior.value = config.behaviorIndex || 0;
        }
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};

// --- EFFECT: Quantum Dust (Revealer Scanner) ---
const QuantumDust = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 1000;
    
    const particles = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const seeds = new Float32Array(count);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 12;
            pos[i*3+1] = (Math.random() - 0.5) * 12;
            pos[i*3+2] = (Math.random() - 0.5) * 12;
            seeds[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        return geo;
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const scanSpeed = config.intensity ? config.intensity * 2.0 : 2.0;
        const scanY = -5 + ((t * scanSpeed) % 20);
        
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array;
            const seeds = pointsRef.current.geometry.attributes.aSeed.array;
            
            for(let i=0; i<count; i++) {
                const s = seeds[i];
                // Particles gravitate towards the scanner plane
                const pIdx = i * 3;
                const targetY = scanY + (Math.sin(t + s * 10) * 0.5);
                positions[pIdx+1] += (targetY - positions[pIdx+1]) * 0.1;
                
                // Spiral horizontal
                const angle = t * 2.0 + s * 10.0;
                const r = 4.0 + Math.sin(t * 0.5 + s) * 2.0;
                positions[pIdx] = Math.cos(angle) * r;
                positions[pIdx+2] = Math.sin(angle) * r;
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.material.opacity = animatedOpacity;
        }
    });

    return (
        <points ref={pointsRef} geometry={particles}>
            <pointsMaterial size={0.06 * (config.scale || 1.0)} color={config.color || "#ffcc00"} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

// --- EFFECT: Cyber Waves ---
const CyberWaves = ({ config = {}, animatedOpacity = 1 }) => {
    const wavesRef = useRef([]);
    const ringCount = 6;
    
    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.speed || 1.0);
        wavesRef.current.forEach((mesh, i) => {
            if (!mesh) return;
            const cycle = (t * 0.3 + i / ringCount) % 1.0;
            const waveScale = 1.0 + cycle * 12.0 * (config.scale || 1.0);
            mesh.scale.setScalar(waveScale);
            mesh.material.opacity = (1.0 - cycle) * animatedOpacity * 0.6;
            
            // Allow manual height offset from config
            const baseY = config.height !== undefined ? config.height : 4.8;
            mesh.position.y = baseY + (cycle * 5.0 - 2.5);
        });
    });

    const isBlur = config.mode === 'Blur';

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            {[...Array(ringCount)].map((_, i) => (
                <mesh key={i} ref={el => wavesRef.current[i] = el}>
                    <ringGeometry args={[0.95, 1.0, 64]} />
                    <meshBasicMaterial 
                        color={config.color || "#00ffff"} 
                        transparent 
                        depthWrite={false} 
                        side={THREE.DoubleSide} 
                        blending={THREE.AdditiveBlending} 
                    />
                </mesh>
            ))}
        </group>
    );
};

// --- EFFECT: Data Stream (Glitchy Pillars) ---
const DataStream = ({ config = {}, animatedOpacity = 1 }) => {
    const count = 200;
    const lines = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const data = new Float32Array(count);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 12;
            pos[i*3+1] = Math.random() * 20 - 10;
            pos[i*3+2] = (Math.random() - 0.5) * 12;
            data[i] = Math.random();
        }
        return { pos, data };
    }, []);

    const linesRef = useRef();
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const speed = (config.speed || 1.0) * 0.2;
        if (linesRef.current) {
            const positions = linesRef.current.geometry.attributes.position.array;
            for(let i=0; i<count; i++) {
                positions[i*3+1] -= speed + (lines.data[i] * 0.1);
                if(positions[i*3+1] < -10) positions[i*3+1] = 10;
            }
            linesRef.current.geometry.attributes.position.needsUpdate = true;
            linesRef.current.material.opacity = animatedOpacity * 0.8;
        }
    });

    return (
        <points ref={linesRef} scale={config.scale || 3.0}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={lines.pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color={config.color || "#00ff00"} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

// --- EFFECT: Geo Swarm (Morphing Shapes) ---
const GeoSwarm = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 600; 
    
    const { sph, cub, rnd } = useMemo(() => {
        const rnd = new Float32Array(count * 3);
        const sph = new Float32Array(count * 3);
        const cub = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            rnd[i*3] = (Math.random() - 0.5) * 15;
            rnd[i*3+1] = (Math.random() - 0.5) * 15;
            rnd[i*3+2] = (Math.random() - 0.5) * 15;
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            sph[i**3] = 4.5 * Math.cos(theta) * Math.sin(phi);
            sph[i*3+1] = 4.5 * Math.sin(theta) * Math.sin(phi);
            sph[i*3+2] = 4.5 * Math.cos(phi);
            const s = 5.0; const face = i % 6; const u = Math.random()-0.5; const v = Math.random()-0.5;
            if (face === 0) { cub[i*3]=s/2; cub[i*3+1]=u*s; cub[i*3+2]=v*s; }
            else if (face === 1) { cub[i*3]=-s/2; cub[i*3+1]=u*s; cub[i*3+2]=v*s; }
            else if (face === 2) { cub[i*3]=u*s; cub[i*3+1]=s/2; cub[i*3+2]=v*s; }
            else { cub[i*3]=u*s; cub[i*3+1]=v*s; cub[i*3+2]=s/2; }
        }
        return { rnd, sph, cub };
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.speed || 1.0) * 0.5;
        if(pointsRef.current) {
            const phase = (t * 0.4) % 3;
            const sub = (t * 0.4) % 1;
            const ease = 0.5 - 0.5 * Math.cos(sub * Math.PI);
            const pos = pointsRef.current.geometry.attributes.position.array;
            for(let i=0; i<count; i++) {
                const idx = i*3;
                if (phase < 1) { 
                    pos[idx] = THREE.MathUtils.lerp(rnd[idx], sph[idx], ease);
                    pos[idx+1] = THREE.MathUtils.lerp(rnd[idx+1], sph[idx+1], ease);
                    pos[idx+2] = THREE.MathUtils.lerp(rnd[idx+2], sph[idx+2], ease);
                } else if (phase < 2) {
                    pos[idx] = THREE.MathUtils.lerp(sph[idx], cub[idx], ease);
                    pos[idx+1] = THREE.MathUtils.lerp(sph[idx+1], cub[idx+1], ease);
                    pos[idx+2] = THREE.MathUtils.lerp(sph[idx+2], cub[idx+2], ease);
                } else {
                    pos[idx] = THREE.MathUtils.lerp(cub[idx], rnd[idx], ease);
                    pos[idx+1] = THREE.MathUtils.lerp(cub[idx+1], rnd[idx+1], ease);
                    pos[idx+2] = THREE.MathUtils.lerp(cub[idx+2], rnd[idx+2], ease);
                }
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.rotation.y = t * 0.2;
        }
    });

    return (
        <points ref={pointsRef} scale={config.scale || 1.5}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={rnd} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.15} color={config.color || "#ffffff"} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

const UnifiedShaderInjection = (mat) => {
    if (mat.userData.unifiedCompiled) return;
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uIrisMix = { value: 0 };
        shader.uniforms.uIrisIntensity = { value: 1.0 };
        shader.uniforms.uIrisColor = { value: new THREE.Color("#ffffff") };
        shader.uniforms.uIrisType = { value: 0 };
        
        shader.uniforms.uGridMix = { value: 0 };
        shader.uniforms.uGridIntensity = { value: 1.0 };
        shader.uniforms.uGridColor = { value: new THREE.Color("#00ffcc") };
        shader.uniforms.uGridPattern = { value: 0 }; // 0:Square, 1:Hex, 2:Dots
        
        shader.uniforms.uEdgeMix = { value: 0 };
        shader.uniforms.uEdgeIntensity = { value: 1.0 };
        shader.uniforms.uEdgeColor = { value: new THREE.Color("#ff00ff") };
        shader.uniforms.uEdgeMetal = { value: 0 }; 
        shader.uniforms.uEdgeRainbow = { value: 0 };
        
        shader.uniforms.uRevealMix = { value: 0 };
        shader.uniforms.uRevealY = { value: 5.0 };
        shader.uniforms.uRevealEdge = { value: 0.5 };
        
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
            
            // Iris (Pearlescent)
            uniform float uIrisMix;
            uniform float uIrisIntensity;
            uniform vec3 uIrisColor;
            uniform float uIrisType;
            
            // Grid
            uniform float uGridMix;
            uniform float uGridIntensity;
            uniform vec3 uGridColor;
            uniform float uGridPattern;
            
            // Edges
            uniform float uEdgeMix;
            uniform float uEdgeIntensity;
            uniform vec3 uEdgeColor;
            uniform float uEdgeMetal;
            uniform float uEdgeRainbow;
            
            // Reveal (Scanner)
            uniform float uRevealMix;
            uniform float uRevealY;
            uniform float uRevealEdge;
            
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            
            // --- Helper: Hex Grid ---
            float hexGrid(vec2 p) {
                p *= 15.0;
                vec2 r = vec2(1.0, 1.732);
                vec2 h = r*.5;
                vec2 a = mod(p, r)-h;
                vec2 b = mod(p-h, r)-h;
                vec2 g = dot(a, a) < dot(b, b) ? a : b;
                return pow(1.0-length(g)*2.0, 10.0);
            }
            
            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>
            // --- REVEAL (SCANNER) LOGIC ---
            if (uRevealMix > 0.5) {
                float dist = abs(vWorldPos.y - uRevealY);
                if (dist > uRevealEdge && vWorldPos.y > uRevealY) discard;
            }
        `).replace(`#include <color_fragment>`, `#include <color_fragment>
            vec3 customViewDir = normalize(vViewPos);
            vec3 customNormal = normalize(vNormalVec);
            float fresnelNode = max(0.0, dot(customNormal, customViewDir));
            float fresnelEffect = pow(1.0 - fresnelNode, 3.0);
            
            // --- 1. PEARLESCENT IRIS ---
            vec3 metallicA = vec3(0.9, 0.9, 1.0); 
            vec3 metallicB = vec3(1.0, 0.85, 0.6); 
            vec3 metallicC = vec3(0.8, 1.0, 0.9); 
            
            float shift = uTime * 0.3 + fresnelNode * 2.0;
            vec3 pearlBase = mix(metallicA, metallicB, 0.5 + 0.5 * sin(shift));
            pearlBase = mix(pearlBase, metallicC, 0.5 + 0.5 * cos(shift * 1.3));
            
            vec3 irisPearlescent = pearlBase * uIrisColor * (0.4 + 1.6 * fresnelEffect);
            vec3 irisEnergy = uIrisColor * 1.8 + vec3(1.0) * fresnelEffect * 4.0;
            vec3 finalIris = uIrisType > 0.5 ? irisEnergy : irisPearlescent;
            
            if (uIrisMix > 0.0) {
                float luster = pow(fresnelNode, 10.0) * 0.5;
                diffuseColor.rgb = mix(diffuseColor.rgb, finalIris + luster, uIrisMix * uIrisIntensity);
            }
            
            // --- 2. HOLO GRID ---
            float gridScale = 20.0;
            float gridBase = 0.0;
            
            if (uGridPattern < 0.5) { // Square
                vec2 gridUV = fract(vWorldPos.xz * gridScale + vWorldPos.y * gridScale * 0.5);
                float lineH = smoothstep(0.0, 0.08, gridUV.x) - smoothstep(0.92, 1.0, gridUV.x);
                float lineV = smoothstep(0.0, 0.08, gridUV.y) - smoothstep(0.92, 1.0, gridUV.y);
                gridBase = max(1.0 - lineH, 1.0 - lineV);
            } else if (uGridPattern < 1.5) { // Hex
                gridBase = hexGrid(vWorldPos.xy + vWorldPos.z);
            } else { // Dots
                vec2 dotUV = fract(vWorldPos.xz * 30.0);
                gridBase = smoothstep(0.4, 0.3, length(dotUV - 0.5));
            }

            float scanWave = smoothstep(0.0, 1.0, sin(vWorldPos.y * 5.0 - uTime * 6.0));
            vec3 gridColorOut = uGridColor * gridBase * (0.5 + 2.0 * scanWave);
            
            if (uGridMix > 0.0) {
                diffuseColor.rgb = mix(diffuseColor.rgb, gridColorOut, uGridMix * uGridIntensity * gridBase);
            }
            
            // --- 3. NEON EDGES ---
            float edgeFresnel = pow(1.0 - fresnelNode, 4.0); 
            float edgePulse = 0.7 + 0.3 * sin(uTime * 4.0 - vWorldPos.y * 2.0);
            
            vec3 finalEdgeColor = uEdgeColor;
            if (uEdgeRainbow > 0.5) {
                finalEdgeColor = 0.5 + 0.5 * cos(uTime + vWorldPos.y + vec3(0,2,4));
            }
            
            vec3 edgeColorOut = finalEdgeColor * edgeFresnel * 4.0; 
            
            if (uEdgeMix > 0.0) {
                if (uEdgeMetal > 0.5) {
                    // Metallic effect: reduce diffuse, add highlights
                    diffuseColor.rgb *= 0.2;
                    diffuseColor.rgb += finalEdgeColor * pow(fresnelNode, 15.0) * 2.0;
                }
                diffuseColor.rgb += edgeColorOut * uEdgeMix * uEdgeIntensity * edgePulse; 
            }

            // --- SCANNER EDGE GLOW ---
            if (uRevealMix > 0.5) {
                float scannerDist = abs(vWorldPos.y - uRevealY);
                float scannerGlow = smoothstep(uRevealEdge, 0.0, scannerDist);
                diffuseColor.rgb += vec3(1.0, 0.8, 0.3) * scannerGlow * 3.0; // Golden scanner edge
            }
        `);
        mat.userData.shader = shader;
    };
    mat.userData.unifiedCompiled = true;
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const { sculptureConfig: config, view, showStudioEditor } = useAppStore();
    const activeSlug = useActiveSlug();
    
    const isEditing = showStudioEditor;
    const isServiceView = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;

    const stateRef = useRef({ activeSlug, config });
    stateRef.current = { activeSlug, config };

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { if (n.isMesh) UnifiedShaderInjection(n.material); });
        return clone;
    }, [scene]);

    const primRef = useRef();
    const groupRef = useRef();
    const isFirstRun = useRef(true);

    useFrame((state, delta) => {
        const { activeSlug: currentSlug, config: currentConfig } = stateRef.current;
        const currentSection = currentConfig.sections?.[currentSlug] || currentConfig.sections?.default;
        
        const irisFX = (currentSection?.fx || []).find(f => f.type === 'Iris' && f.active);
        const holoGridFX = (currentSection?.fx || []).find(f => f.type === 'HoloGrid' && f.active);
        const neonEdgesFX = (currentSection?.fx || []).find(f => f.type === 'NeonEdges' && f.active);
        const tetrisFX = (currentSection?.fx || []).find(f => f.type === 'TetrisReveal' && f.active);

        // Target calculations
        let tgtScale = currentSection?.scale ?? currentConfig?.scale ?? 17;
        if (tgtScale < 5 || tgtScale > 50) tgtScale = 17;
        
        const tgtY = 5.1 + (currentConfig?.y ?? 0);
        const tgtRot = Number.isFinite(Number(currentConfig?.rotationY)) ? Number(currentConfig.rotationY) : 248;

        const s = isEditing ? 8.0 : 1.5; // Faster damping when editing
        const d = Math.max(0.001, Math.min(0.2, delta || 0.016));

        if (isFirstRun.current && groupRef.current && primRef.current) {
            groupRef.current.position.y = tgtY;
            primRef.current.scale.setScalar(tgtScale);
            primRef.current.rotation.y = THREE.MathUtils.degToRad(tgtRot);
            isFirstRun.current = false;
        } else if (groupRef.current && primRef.current) {
            groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, tgtY, s, d);
            primRef.current.scale.setScalar(THREE.MathUtils.damp(primRef.current.scale.x, tgtScale, s, d));
            primRef.current.rotation.y = THREE.MathUtils.damp(primRef.current.rotation.y, THREE.MathUtils.degToRad(tgtRot), s, d);
        }

        clonedScene.traverse(n => {
            const shader = n.material?.userData?.shader;
            if (shader) {
                shader.uniforms.uTime.value = state.clock.elapsedTime;
                
                // Iris
                shader.uniforms.uIrisMix.value = irisFX ? 1.0 : 0;
                if (irisFX) {
                    shader.uniforms.uIrisIntensity.value = irisFX.intensity ?? 1.0;
                    shader.uniforms.uIrisColor.value.set(irisFX.color || "#ffcc00");
                    shader.uniforms.uIrisType.value = irisFX.presetIndex ?? 0;
                }
                
                // HoloGrid
                shader.uniforms.uGridMix.value = holoGridFX ? 1.0 : 0;
                if (holoGridFX) {
                    shader.uniforms.uGridIntensity.value = holoGridFX.intensity ?? 1.0;
                    shader.uniforms.uGridColor.value.set(holoGridFX.color || "#00ffcc");
                    shader.uniforms.uGridPattern.value = holoGridFX.patternIndex ?? 0; 
                }
                
                // NeonEdges
                shader.uniforms.uEdgeMix.value = neonEdgesFX ? 1.0 : 0;
                if (neonEdgesFX) {
                    shader.uniforms.uEdgeIntensity.value = neonEdgesFX.intensity ?? 1.0;
                    shader.uniforms.uEdgeColor.value.set(neonEdgesFX.color || "#ff00ff");
                    shader.uniforms.uEdgeMetal.value = neonEdgesFX.metalness ? 1.0 : 0;
                    shader.uniforms.uEdgeRainbow.value = neonEdgesFX.rainbow ? 1.0 : 0;
                }

                // Quantum Reveal (Scanner)
                shader.uniforms.uRevealMix.value = tetrisFX ? 1.0 : 0;
                if (tetrisFX) {
                    const scanSpeed = tetrisFX.speed ?? 1.0;
                    const scanY = -5 + ((state.clock.elapsedTime * scanSpeed * 2.0) % 20);
                    shader.uniforms.uRevealY.value = scanY;
                    shader.uniforms.uRevealEdge.value = tetrisFX.scale ? tetrisFX.scale * 1.5 : 1.5;
                }
            }
            if (n.isMesh) {
                n.material.envMapIntensity = currentConfig.envMapIntensity ?? 0.02;
                // Scanner transparency logic
                if (tetrisFX) {
                    n.material.transparent = true;
                    n.material.opacity = tetrisFX.mode === 'Solid' ? 1.0 : 0.05;
                } else {
                    n.material.transparent = false;
                    n.material.opacity = 1.0;
                }
            }
        });
    });

    useEffect(() => {
        window.resetSculpture = () => {
            useAppStore.setState({ sculptureConfig: { ...useAppStore.getState().sculptureConfig, y: 0, scale: 17, rotationY: 248 } });
            console.log("Model parameters forcibly reset!");
        };
    }, []);

    // Defensive parsing against destructive DB string/null formats
    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
    
    return (
        <Float 
            speed={isEditing ? 0 : 0.4} 
            rotationIntensity={isEditing ? 0 : 0.5} 
            floatIntensity={isEditing ? 0 : 0.5}
        >
            <group ref={groupRef}>
                <Center bottom>
                    <primitive 
                        ref={primRef}
                        object={clonedScene} 
                    />
                    
                    {/* NEW DYNAMIC FX SYSTEM */}
                    {(currentSection?.fx || []).map(fx => (
                        <FXWrapper 
                            key={fx.id}
                            type={fx.type}
                            config={fx}
                            isActive={fx.active}
                        />
                    ))}
                </Center>
            </group>
        </Float>
    );
};

const SmoothLoader = ({ progress }) => {
    const [displayProgress, setDisplayProgress] = useState(0);
    const lastProgress = useRef(0);
    
    useFrame((state, delta) => {
        // If the real progress jumped, sync my reference
        if (progress > lastProgress.current) {
            lastProgress.current = progress;
        }

        // --- SMART GROWTH LOGIC ---
        // 1. If we are at 100% real progress, jump there fast
        // 2. If we are stuck (e.g. at 33%), keep growing very slowly up to 99%
        let target = Math.max(displayProgress, lastProgress.current);
        
        if (target < 100) {
            // Fake growth: move 0.1% of the remaining distance to 99 each second
            target += (99.5 - target) * 0.002;
        }

        // Interpolate for smooth visuals
        setDisplayProgress(p => {
            const next = THREE.MathUtils.lerp(p, target, delta * 3.0);
            return Math.min(100, next);
        });
    });

    return (
        <Html center>
            <div style={{ 
                color: 'white', 
                fontFamily: 'monospace', 
                fontSize: '11px', 
                textAlign: 'center', 
                letterSpacing: '6px',
                width: '300px',
                textShadow: '0 0 20px rgba(255,255,255,0.2)'
            }}>
                <div style={{ opacity: 0.3, marginBottom: '8px', fontSize: '8px', letterSpacing: '2px' }}>
                    SYNCHRONIZING_CORE_GEOMETRY
                </div>
                <div style={{ fontWeight: '900', fontSize: '20px', color: displayProgress > 95 ? '#ffcc00' : 'white' }}>
                    {Math.round(displayProgress)}%
                </div>
                <div style={{ 
                    marginTop: '15px', 
                    width: '100%', 
                    height: '2px', 
                    background: 'rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '2px'
                }}>
                    <div style={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${displayProgress}%`,
                        background: '#ffcc00',
                        boxShadow: '0 0 15px rgba(255, 204, 0, 0.5)',
                        transition: 'width 0.1s linear'
                    }} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '7px', opacity: 0.2, textTransform: 'uppercase' }}>
                    Decompressing artifacts...
                </div>
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

useGLTF.preload('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
export default BrutalistTotem;
