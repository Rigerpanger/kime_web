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

// --- EFFECT: AI (NeuralAtom) Only Core ---
const NeuralAtom = ({ config = {}, animatedOpacity = 1 }) => {
    const coreRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            coreRef.current.rotation.y = t * 0.5;
            coreRef.current.rotation.z = t * 0.3;
            coreRef.current.scale.setScalar((1 + Math.sin(t * 3) * 0.1) * (config.scale || 1.0));
        }
    });

    return (
        <group>
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color={config.color || "#ffcc00"} wireframe transparent opacity={animatedOpacity * (config.intensity ?? 1.0)} />
            </mesh>
        </group>
    );
};

// --- EFFECT: AI (NeuralSwarm) Only Particles ---
const NeuralSwarm = ({ config = {}, animatedOpacity = 1 }) => {
    const groupRef = useRef();

    const particles = useMemo(() => {
        const count = 300;
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorObj = new THREE.Color(config.color || "#ffcc00");
        
        for (let i = 0; i < count; i++) {
            const r = 2.5 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = r * Math.cos(phi);
            colorObj.toArray(colors, i * 3);
        }
        return { pos, colors };
    }, [config.color]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * -0.2;
            groupRef.current.scale.setScalar(config.scale || 1.0);
        }
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={300} array={particles.pos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={300} array={particles.colors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.08} vertexColors transparent opacity={animatedOpacity * (config.intensity ?? 1.0) * 0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>
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

// --- EFFECT: Software Silhouette ---
const SoftwareSilhouette = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 500;
    
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const offsets = new Float32Array(count); 
        const lanes = new Float32Array(count); 
        const speeds = new Float32Array(count);
        
        for(let i=0; i<count; i++) {
            offsets[i] = Math.random() * Math.PI * 2;
            const laneType = Math.floor(Math.random() * 4); 
            lanes[i] = 3.5 + laneType * 1.5; 
            pos[i*3 + 1] = (Math.random() - 0.5) * 8.0; 
            speeds[i] = 0.4 + Math.random() * 0.4;
            
            // Cluster logic (5-10 particles grouped together)
            if (i > 0 && Math.random() < 0.85) {
                offsets[i] = offsets[i-1] + (Math.random() - 0.5) * 0.15;
                lanes[i] = lanes[i-1];
                pos[i*3 + 1] = pos[(i-1)*3 + 1] + (Math.random() - 0.5) * 0.8;
                speeds[i] = speeds[i-1];
            }
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
        geo.setAttribute('aLane', new THREE.BufferAttribute(lanes, 1));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        return geo;
    }, []);

    const material = useMemo(() => {
        const p = Array.isArray(config.pos) ? config.pos : [0, 4.8, 0];
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 },
                uColorStart: { value: new THREE.Color("#00aaff") },
                uColorEnd: { value: new THREE.Color("#ffdd00") },
                uCenter: { value: new THREE.Vector3(p[0], p[1], p[2]) },
                uScale: { value: config.scale || 1.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec3 uCenter;
                uniform float uScale;
                attribute float aOffset;
                attribute float aLane;
                attribute float aSpeed;
                varying float vProgress;
                void main() {
                    float angle = aOffset + uTime * aSpeed;
                    vProgress = fract(angle / (3.14159 * 2.0));
                    vec3 p = position;
                    p.x = cos(angle) * aLane * uScale;
                    p.z = sin(angle) * aLane * uScale;
                    p += uCenter;
                    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = (15.0 * uScale / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uOpacity;
                uniform vec3 uColorStart;
                uniform vec3 uColorEnd;
                varying float vProgress;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    vec3 finalColor = mix(uColorStart, uColorEnd, sin(vProgress * 3.14159));
                    gl_FragColor = vec4(finalColor, uOpacity * (1.0 - dist * 2.0));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }, [config.pos, config.scale]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
            pointsRef.current.material.uniforms.uOpacity.value = animatedOpacity * (config.intensity || 1.0);
            pointsRef.current.material.uniforms.uScale.value = config.scale || 1.0;
        }
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};

// --- EFFECT: Quantum Dust ---
const QuantumDust = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 400;
    
    const particles = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 15;
            pos[i*3+1] = (Math.random() - 0.5) * 15;
            pos[i*3+2] = (Math.random() - 0.5) * 15;
            phases[i] = Math.random() * Math.PI * 2;
        }
        return { pos, phases };
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if(pointsRef.current) {
            pointsRef.current.rotation.y = t * 0.05;
            pointsRef.current.rotation.x = t * 0.02;
            pointsRef.current.material.opacity = (0.5 + Math.sin(t) * 0.3) * animatedOpacity * (config.intensity || 1.0);
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles.pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={config.scale ? 0.05 * config.scale : 0.05} color={config.color || "#ffffff"} transparent opacity={animatedOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

// --- EFFECT: Cyber Waves ---
const CyberWaves = ({ config = {}, animatedOpacity = 1 }) => {
    const wavesRef = useRef([]);
    const ringCount = 4;
    
    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.intensity || 1.0);
        wavesRef.current.forEach((mesh, i) => {
            if (!mesh) return;
            const cycle = (t * 0.5 + i / ringCount) % 1.0;
            const waveScale = 1.0 + cycle * 10.0 * (config.scale || 1.0);
            mesh.scale.setScalar(waveScale);
            mesh.material.opacity = (1.0 - cycle) * animatedOpacity * 0.8;
            mesh.position.y = cycle * 8.0 - 4.0;
        });
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            {[...Array(ringCount)].map((_, i) => (
                <mesh key={i} ref={el => wavesRef.current[i] = el}>
                    <ringGeometry args={[0.9, 1.0, 64]} />
                    <meshBasicMaterial color={config.color || "#00ffff"} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

// --- EFFECT: Data Stream ---
const DataStream = ({ config = {}, animatedOpacity = 1 }) => {
    const count = 150;
    const lines = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random() - 0.5) * 8;
            pos[i*3+1] = Math.random() * 20 - 10;
            pos[i*3+2] = (Math.random() - 0.5) * 8;
        }
        return { pos };
    }, []);

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(config.color || "#00ff00") },
                uOpacity: { value: 0 }
            },
            vertexShader: `
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = ${config.scale ? 20.0 * config.scale : 20.0} / -mvPosition.z;
                }`,
            fragmentShader: `
                uniform vec3 uColor; uniform float uOpacity;
                void main() {
                    vec2 uv = gl_PointCoord.xy - 0.5;
                    float a = exp(-300.0 * (uv.x * uv.x));
                    float b = exp(-2.0 * (uv.y * uv.y));
                    gl_FragColor = vec4(uColor, a * b * uOpacity);
                }`,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        })
    }, [config.color, config.scale]);

    const linesRef = useRef();
    useFrame((state) => {
        const t = state.clock.elapsedTime * 5.0 * (config.intensity || 1.0);
        if (linesRef.current) {
            const positions = linesRef.current.geometry.attributes.position.array;
            for(let i=0; i<count; i++) {
                positions[i*3+1] -= 0.1 * (config.intensity || 1.0);
                if(positions[i*3+1] < -10) positions[i*3+1] = 10 + Math.random() * 5;
            }
            linesRef.current.geometry.attributes.position.needsUpdate = true;
            linesRef.current.material.uniforms.uOpacity.value = animatedOpacity * 0.8;
        }
    });

    return (
        <points ref={linesRef} material={material}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={lines.pos} itemSize={3} />
            </bufferGeometry>
        </points>
    );
};

// --- EFFECT: Geo Swarm ---
const GeoSwarm = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 400; // Increased density for better cube definition
    
    const { randomPos, spherePos, cubePos, colors } = useMemo(() => {
        const rnd = new Float32Array(count * 3);
        const sph = new Float32Array(count * 3);
        const cub = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const colorPalette = [new THREE.Color("#ff0044"), new THREE.Color("#00ffcc"), new THREE.Color("#ffcc00")];
        
        for(let i=0; i<count; i++) {
            // 1. Random Cloud
            rnd[i*3] = (Math.random() - 0.5) * 20;
            rnd[i*3+1] = (Math.random() - 0.5) * 20;
            rnd[i*3+2] = (Math.random() - 0.5) * 20;
            
            // 2. Sphere
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            const r = 3.5;
            sph[i*3] = r * Math.cos(theta) * Math.sin(phi);
            sph[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
            sph[i*3+2] = r * Math.cos(phi);

            // 3. Cube (Geometric Shape)
            const side = 4.0;
            const face = i % 6;
            const u = Math.random() - 0.5;
            const v = Math.random() - 0.5;
            if (face === 0) { cub[i*3] = side/2; cub[i*3+1] = u * side; cub[i*3+2] = v * side; }
            else if (face === 1) { cub[i*3] = -side/2; cub[i*3+1] = u * side; cub[i*3+2] = v * side; }
            else if (face === 2) { cub[i*3] = u * side; cub[i*3+1] = side/2; cub[i*3+2] = v * side; }
            else if (face === 3) { cub[i*3] = u * side; cub[i*3+1] = -side/2; cub[i*3+2] = v * side; }
            else if (face === 4) { cub[i*3] = u * side; cub[i*3+1] = v * side; cub[i*3+2] = side/2; }
            else { cub[i*3] = u * side; cub[i*3+1] = v * side; cub[i*3+2] = -side/2; }
            
            colorPalette[i % 3].toArray(col, i * 3);
        }
        return { randomPos: rnd, spherePos: sph, cubePos: cub, colors: col };
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime * (config.intensity || 1.0) * 0.4;
        if(pointsRef.current) {
            // Animation sequence: 0->0.33 (Rnd), 0.33->0.66 (Sphere), 0.66->1.0 (Cube)
            const phase = (state.clock.elapsedTime * 0.2) % 3; // 3 phases
            const subTime = (state.clock.elapsedTime * 0.2) % 1;
            const ease = subTime < 0.5 ? 4 * subTime * subTime * subTime : 1 - Math.pow(-2 * subTime + 2, 3) / 2;
            
            const positions = pointsRef.current.geometry.attributes.position.array;
            for(let i=0; i<count; i++) {
                if (phase < 1) {
                    // Random -> Sphere
                    positions[i*3] = THREE.MathUtils.lerp(randomPos[i*3], spherePos[i*3], ease);
                    positions[i*3+1] = THREE.MathUtils.lerp(randomPos[i*3+1], spherePos[i*3+1], ease);
                    positions[i*3+2] = THREE.MathUtils.lerp(randomPos[i*3+2], spherePos[i*3+2], ease);
                } else if (phase < 2) {
                    // Sphere -> Cube
                    positions[i*3] = THREE.MathUtils.lerp(spherePos[i*3], cubePos[i*3], ease);
                    positions[i*3+1] = THREE.MathUtils.lerp(spherePos[i*3+1], cubePos[i*3+1], ease);
                    positions[i*3+2] = THREE.MathUtils.lerp(spherePos[i*3+2], cubePos[i*3+2], ease);
                } else {
                    // Cube -> Random
                    positions[i*3] = THREE.MathUtils.lerp(cubePos[i*3], randomPos[i*3], ease);
                    positions[i*3+1] = THREE.MathUtils.lerp(cubePos[i*3+1], randomPos[i*3+1], ease);
                    positions[i*3+2] = THREE.MathUtils.lerp(cubePos[i*3+2], randomPos[i*3+2], ease);
                }
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.rotation.y = t * 0.3;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={randomPos} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={config.scale ? 0.2 * config.scale : 0.2} vertexColors transparent opacity={animatedOpacity * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
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
        
        shader.uniforms.uEdgeMix = { value: 0 };
        shader.uniforms.uEdgeIntensity = { value: 1.0 };
        shader.uniforms.uEdgeColor = { value: new THREE.Color("#ff00ff") };
        
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
            
            // Iris (Pearlescent)
            uniform float uIrisMix;
            uniform float uIrisIntensity;
            uniform vec3 uIrisColor;
            uniform float uIrisType;
            
            // Grid
            uniform float uGridMix;
            uniform float uGridIntensity;
            uniform vec3 uGridColor;
            
            // Edges
            uniform float uEdgeMix;
            uniform float uEdgeIntensity;
            uniform vec3 uEdgeColor;
            
            uniform float uRevealMix;
            uniform float uRevealHeight;
            
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            
            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>
            if (uRevealMix > 0.5 && vWorldPos.y > uRevealHeight) discard;
        `).replace(`#include <color_fragment>`, `#include <color_fragment>
            vec3 customViewDir = normalize(vViewPos);
            vec3 customNormal = normalize(vNormalVec);
            float fresnelNode = max(0.0, dot(customNormal, customViewDir));
            float fresnelEffect = pow(1.0 - fresnelNode, 3.0);
            
            // --- 1. PEARLESCENT IRIS ---
            // Premium metallic iridescence effect
            // Uses a more sophisticated palette including silver, titanium, and soft gold
            vec3 metallicA = vec3(0.9, 0.9, 1.0); // Silver/Titanium
            vec3 metallicB = vec3(1.0, 0.85, 0.6); // Soft Gold
            vec3 metallicC = vec3(0.8, 1.0, 0.9); // Pale Mint/Pearl
            
            float shift = uTime * 0.3 + fresnelNode * 2.0;
            vec3 pearlBase = mix(metallicA, metallicB, 0.5 + 0.5 * sin(shift));
            pearlBase = mix(pearlBase, metallicC, 0.5 + 0.5 * cos(shift * 1.3));
            
            vec3 irisPearlescent = pearlBase * uIrisColor * (0.4 + 1.6 * fresnelEffect);
            vec3 irisEnergy = uIrisColor * 1.8 + vec3(1.0) * fresnelEffect * 4.0;
            vec3 finalIris = uIrisType > 0.5 ? irisEnergy : irisPearlescent;
            
            if (uIrisMix > 0.0) {
                // Add metallic shine logic
                float luster = pow(fresnelNode, 10.0) * 0.5; // Central highlights
                diffuseColor.rgb = mix(diffuseColor.rgb, finalIris + luster, uIrisMix * uIrisIntensity);
                // Boost specular feel
                specularStrength += uIrisMix * uIrisIntensity * fresnelEffect * 2.0;
            }
            
            // --- 2. HOLO GRID ---
            float gridScale = 20.0;
            vec2 gridUV = fract(vWorldPos.xz * gridScale + vWorldPos.y * gridScale * 0.5);
            float lineH = smoothstep(0.0, 0.08, gridUV.x) - smoothstep(0.92, 1.0, gridUV.x);
            float lineV = smoothstep(0.0, 0.08, gridUV.y) - smoothstep(0.92, 1.0, gridUV.y);
            float gridBase = max(1.0 - lineH, 1.0 - lineV);
            float scanWave = smoothstep(0.0, 1.0, sin(vWorldPos.y * 5.0 - uTime * 6.0));
            vec3 gridColorOut = uGridColor * gridBase * (0.5 + 2.0 * scanWave);
            
            if (uGridMix > 0.0) {
                diffuseColor.rgb = mix(diffuseColor.rgb, gridColorOut, uGridMix * uGridIntensity * gridBase);
            }
            
            // --- 3. NEON EDGES ---
            float edgeFresnel = pow(1.0 - fresnelNode, 4.0); // Sharp falloff
            float edgePulse = 0.7 + 0.3 * sin(uTime * 4.0 - vWorldPos.y * 2.0);
            vec3 edgeColorOut = uEdgeColor * edgeFresnel * 4.0; 
            
            if (uEdgeMix > 0.0) {
                // Additive glow on top of whatever material is there
                diffuseColor.rgb += edgeColorOut * uEdgeMix * uEdgeIntensity * edgePulse; 
            }
        `);
        mat.userData.shader = shader;
    };
    mat.userData.unifiedCompiled = true;
};

const SculptureModel = () => {
    // Enable Draco decompression for 10x faster loading and GPU upload
    const { scene } = useGLTF('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const { sculptureConfig: config, view, showStudioEditor } = useAppStore();
    const activeSlug = useActiveSlug();
    const [revealHeight, setRevealHeight] = useState(15);

    // Use a ref for reactive state within useFrame to avoid stale closure issues
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

        // Target calculations for model shape/position
        let tgtScale = currentSection?.scale ?? currentConfig?.scale ?? 17;
        if (tgtScale < 5 || tgtScale > 50) tgtScale = 17;
        
        let baseY = currentSection?.modelY ?? 5.1;
        if (typeof baseY !== 'number' || baseY < -20 || baseY > 50) baseY = 5.1;
        const tgtY = baseY + (currentConfig?.y ?? 0);
        
        const tgtRot = Number.isFinite(Number(currentConfig?.rotationY)) ? Number(currentConfig.rotationY) : 248;

        const s = isEditing ? 4.0 : 1.0;
        const d = Math.max(0.001, Math.min(0.2, delta || 0.016));

        // Smoothly damp model properties
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
                
                // --- Iris Uniforms ---
                shader.uniforms.uIrisMix.value = irisFX ? 1.0 : 0;
                if (irisFX) {
                    shader.uniforms.uIrisIntensity.value = irisFX.intensity ?? 1.0;
                    shader.uniforms.uIrisColor.value.set(irisFX.color || "#ffcc00");
                    shader.uniforms.uIrisType.value = irisFX.presetIndex ?? 0;
                }
                
                // --- HoloGrid Uniforms ---
                shader.uniforms.uGridMix.value = holoGridFX ? 1.0 : 0;
                if (holoGridFX) {
                    shader.uniforms.uGridIntensity.value = holoGridFX.intensity ?? 1.0;
                    shader.uniforms.uGridColor.value.set(holoGridFX.color || "#00ffcc");
                }
                
                // --- NeonEdges Uniforms ---
                shader.uniforms.uEdgeMix.value = neonEdgesFX ? 1.0 : 0;
                if (neonEdgesFX) {
                    shader.uniforms.uEdgeIntensity.value = neonEdgesFX.intensity ?? 1.0;
                    shader.uniforms.uEdgeColor.value.set(neonEdgesFX.color || "#ff00ff");
                }

                // --- Tetris Uniforms ---
                shader.uniforms.uRevealMix.value = tetrisFX ? 1.0 : 0;
                shader.uniforms.uRevealHeight.value = revealHeight;
            }
            if (n.isMesh) {
                n.material.envMapIntensity = currentConfig.envMapIntensity ?? 0.02;
                n.material.opacity = tetrisFX ? 0.4 : 1.0;
                n.material.transparent = !!tetrisFX;
            }
        });
    });

    const isServiceView = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;
    // Disable floating when in editor to ensure accurate camera framing
    const isEditing = showStudioEditor;

    useEffect(() => {
        // Fallback injection to manually restore the 3D scene from browser JS console
        window.resetSculpture = () => {
            useAppStore.setState({ 
                sculptureConfig: { 
                    ...useAppStore.getState().sculptureConfig, 
                    y: 5.1, 
                    scale: 17, 
                    rotationY: 248 
                } 
            });
            console.log("Model parameters forcibly reset! (y, scale, rotation restored to safety values)");
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
