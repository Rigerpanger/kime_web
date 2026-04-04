import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useGLTF, Float, Environment, ContactShadows, Center, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';


// --- CINEMATIC CAMERA RIG ---
const TotemCameraRig = () => {
    const view = useAppStore(s => s.view);
    const { camera } = useThree();
    const currentLookAt = useRef(new THREE.Vector3(0, 1, 0));

    useFrame((state, delta) => {
        const targetPos = new THREE.Vector3(0, 1, 42); 
        const targetLook = new THREE.Vector3(0, 1, 0);

        switch (view) {
            case VIEWS.HOME:
                targetPos.set(0, 0.0, 32); // Slightly closer for the real model
                targetLook.set(0, 0.0, 0);
                break;
            case VIEWS.ABOUT:
                targetPos.set(0, 4.5, 6); // Focus on upper part
                targetLook.set(0, 4.5, 0);
                break;
            case VIEWS.SERVICES:
                targetPos.set(12, 1.5, 0); // Side view
                targetLook.set(0, 1.5, 0);
                break;
            case VIEWS.PROJECTS:
                targetPos.set(0, 1.5, 9.0); // Focus on chest area
                targetLook.set(0, 1.5, 0);
                break;
            case VIEWS.CONTACT:
                targetPos.set(0, -3.5, 12); // Focus on base
                targetLook.set(0, -3.5, 0);
                break;
            default: break;
        }

        const alpha = 1 - Math.exp(-2.0 * delta);
        state.camera.position.lerp(targetPos, alpha);
        currentLookAt.current.lerp(targetLook, alpha);
        state.camera.lookAt(currentLookAt.current);
    });

    return null;
};

const GoldenDust = () => {
    const count = 50;
    const meshRef = useRef();
    const parts = useMemo(() => new Array(count).fill(0).map(() => ({
        pos: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5),
        speed: Math.random() * 0.1 + 0.05,
        phase: Math.random() * Math.PI * 2
    })), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.children.forEach((child, i) => {
            const p = parts[i];
            child.position.y = -5 + ((p.pos.y + t * p.speed + p.phase * 5) % 15);
            child.position.x = p.pos.x + Math.sin(t * 0.5 + p.phase) * 0.2;
            child.position.z = p.pos.z + Math.cos(t * 0.5 + p.phase) * 0.2;
            const dist = Math.abs(child.position.y - 1.5);
            const scale = Math.max(0, 1 - dist / 8.0) * 0.03;
            child.scale.setScalar(scale);
        });
    });

    return (
        <group ref={meshRef}>
            {parts.map((_, i) => (
                <mesh key={i}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color="#ffcc00" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

const FlashEffect = () => {
    const light = useRef();
    const activeSlug = useAppStore(s => s.activeSlug);
    const [intensity, setIntensity] = useState(0);

    useEffect(() => {
        if (!activeSlug) return;
        setIntensity(40);
        const t = setTimeout(() => setIntensity(0), 800);
        return () => clearTimeout(t);
    }, [activeSlug]);

    useFrame((state, delta) => {
        if (!light.current) return;
        light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, intensity, 0.1);
    });

    return (
        <pointLight
            ref={light}
            position={[0, 4.8, 1.2]} // At head level
            color="#ffffff"
            distance={20}
            decay={1.5}
        />
    );
};

// --- ARTISTIC INTERVENTIONS (The Kime-style Digital Art) ---

// ScanLine removed as per request for more contrasty Iris Shader directly on mesh.

const NeuralCore = () => {
    const coreRef = useRef();
    const beamsRef = useRef();
    const count = 15;
    
    const [beams, phases] = useMemo(() => {
        const positions = new Float32Array(count * 2 * 3);
        const phs = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            phs[i] = Math.random() * Math.PI * 2;
        }
        return [positions, phs];
    }, []);

    useFrame((state) => {
        if (!coreRef.current) return;
        const t = state.clock.elapsedTime;
        coreRef.current.rotation.y += 0.02;
        coreRef.current.rotation.z += 0.01;
        coreRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);

        if (beamsRef.current) {
            const attr = beamsRef.current.geometry.attributes.position;
            for (let i = 0; i < count; i++) {
                const angle = phases[i] + t * 0.5;
                const r = 2.5 + Math.sin(t + phases[i]) * 1.5;
                attr.setXYZ(i * 2, 0, 4.8, 0); // Core center at head level
                attr.setXYZ(i * 2 + 1, Math.cos(angle) * r, 4.8 + Math.sin(angle * 2) * r, Math.sin(angle) * r);
            }
            attr.needsUpdate = true;
        }
    });

    return (
        <group position={[0, 3.3, 0]}> {/* Adjusted from 1.5 to 4.8 total */}
            {/* Geometric Core */}
            <mesh ref={coreRef} position={[0, 1.5, 0]}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color="#ffcc00" wireframe />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Neural Beams connecting facets */}
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
    const [shape, setShape] = useState(0); // 0: cube, 1: sphere, 2: pyramid
    
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.5;
            meshRef.current.rotation.z = t * 0.2;
            
            // Material Flip every 1.5s
            const cycle = (t % 3) / 3;
            const isWireframe = cycle > 0.5;
            meshRef.current.material.wireframe = isWireframe;
            meshRef.current.material.opacity = 0.5 + Math.sin(t * 2) * 0.3;
            
            // Switch shape every 3s
            if (Math.floor(t / 3) % 4 !== shape) {
                setShape(Math.floor(t / 3) % 3);
            }
        }
    });

    return (
        <group position={[0, 1.5, 0]}>
            <mesh ref={meshRef}>
                {shape === 0 ? <boxGeometry args={[2, 2, 2]} /> : 
                 shape === 1 ? <sphereGeometry args={[1.5, 32, 32]} /> : 
                 <coneGeometry args={[1.5, 2.5, 4]} />}
                <meshBasicMaterial 
                    color="#ffaa44" 
                    transparent 
                    opacity={0.8} 
                    blending={THREE.AdditiveBlending} 
                />
            </mesh>
            <pointLight distance={10} intensity={2} color="#ffaa44" />
        </group>
    );
};

const TetrisReveal = ({ onRevealed }) => {
    const [blocks, setBlocks] = useState([]);
    const sculptureRevealed = useRef(false);

    useEffect(() => {
        const spawnBlock = () => {
            setBlocks(prev => {
                if (prev.length >= 6) return prev;
                return [...prev, {
                    id: Math.random(),
                    pos: new THREE.Vector3((Math.random() - 0.5) * 4, 15, (Math.random() - 0.5) * 4),
                    speed: 0.08 + Math.random() * 0.05 // Slower speed
                }];
            });
        };
        const interval = setInterval(spawnBlock, 1500);
        return () => clearInterval(interval);
    }, []);

    useFrame((state, delta) => {
        let lowestY = 15;
        blocks.forEach(b => {
            if (b.pos.y > -5) {
                b.pos.y -= b.speed;
                lowestY = Math.min(lowestY, b.pos.y);
            }
        });
        
        // Reveal model based on block progress
        if (!sculptureRevealed.current) {
            const h = Math.max(-5, 12 - lowestY * 1.5);
            onRevealed(h);
            if (h >= 12) {
                sculptureRevealed.current = true;
                // Clear blocks after a delay
                setTimeout(() => setBlocks([]), 2000);
            }
        }
    });

    return (
        <group>
            {blocks.map(b => (
                <mesh key={b.id} position={b.pos}>
                    <boxGeometry args={[1.5, 1.5, 1.5]} />
                    <meshBasicMaterial color="#ffaa44" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

const NeuralHalo = () => {
    const segmentsRef = useRef();
    const ringRef = useRef();
    const count = 50; 
    
    // Using a single buffer geometry with LineSegments is MUCH more performant
    const [positions, data] = useMemo(() => {
        const pos = new Float32Array(count * 4 * 3); // 2 segments (4 points) per path
        const d = new Float32Array(count); // Phase
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 2.5 + Math.random() * 0.5;
            const top = new THREE.Vector3(Math.cos(angle) * r, 8.5, Math.sin(angle) * r);
            const mid = new THREE.Vector3(Math.cos(angle) * (r * 0.6), 6.5, Math.sin(angle) * (r * 0.6));
            const bottom = new THREE.Vector3(Math.cos(angle) * 0.3, 5.2, Math.sin(angle) * 0.3);
            
            top.toArray(pos, i * 12 + 0);
            mid.toArray(pos, i * 12 + 3);
            mid.toArray(pos, i * 12 + 6);
            bottom.toArray(pos, i * 12 + 9);
            
            d[i] = Math.random() * Math.PI * 2;
        }
        return [pos, d];
    }, []);

    useFrame((state) => {
        if (!segmentsRef.current) return;
        const t = state.clock.elapsedTime;
        // Overall pulse for the halo
        const pulse = (Math.sin(t * 1.5) + 1) / 2;
        segmentsRef.current.material.opacity = 0.2 + pulse * 0.3;
        if (ringRef.current) {
            ringRef.current.position.y = 8.5 + Math.sin(t) * 0.05;
            ringRef.current.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
        }
    });

    return (
        <group>
            <lineSegments ref={segmentsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color="#ffaa44" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
            </lineSegments>
            <mesh ref={ringRef} position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.5, 0.015, 16, 100]} />
                <meshBasicMaterial color="#ffaa44" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
};

const SoftwareSilhouette = ({ targetVertices }) => {
    const pointsRef = useRef();
    const count = 2000;
    const state = useRef({ phase: 'fall', timer: 0 }); // fall -> form -> shift

    const [positions, data, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const d = new Float32Array(count * 3); // random sky start
        const cols = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = 20 + Math.random() * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
            cols[i * 3] = 1; cols[i * 3 + 1] = 0.6; cols[i * 3 + 2] = 0.2;
        }
        return [pos, d, cols];
    }, []);

    useFrame((stateObj, delta) => {
        if (!pointsRef.current || !targetVertices.length) return;
        const t = stateObj.clock.elapsedTime;
        const array = pointsRef.current.geometry.attributes.position.array;
        
        state.current.timer += delta;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            // Target is a vertex from the actual model
            const vIdx = i % targetVertices.length;
            const targetPos = targetVertices[vIdx];

            if (state.current.timer < 5) {
                // FALL and FORM
                array[idx] = THREE.MathUtils.lerp(array[idx], targetPos.x, 0.05);
                array[idx + 1] = THREE.MathUtils.lerp(array[idx + 1], targetPos.y, 0.05);
                array[idx + 2] = THREE.MathUtils.lerp(array[idx + 2], targetPos.z, 0.05);
            } else if (state.current.timer < 10) {
                // SHIFT SIDEWAYS
                array[idx] = THREE.MathUtils.lerp(array[idx], targetPos.x + 8, 0.02);
                array[idx + 1] = THREE.MathUtils.lerp(array[idx + 1], targetPos.y, 0.02);
                array[idx + 2] = THREE.MathUtils.lerp(array[idx + 2], targetPos.z, 0.02);
                pointsRef.current.material.opacity = Math.max(0, 1 - (state.current.timer - 8) / 2);
            } else {
                // RESET
                state.current.timer = 0;
                pointsRef.current.material.opacity = 0.8;
                for (let j = 0; j < count; j++) {
                    array[j * 3 + 1] = 20 + Math.random() * 10;
                }
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.25} color="#ffaa44" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </points>
    );
};

const ArtisticIntervention = ({ slug, targetVertices, onRevealed }) => {
    switch (slug) {
        case 'ar-vr':
            return <ShapeShifter />;
        case 'ai-ml':
            return <NeuralCore />;
        case 'software-dev':
            return <SoftwareSilhouette targetVertices={targetVertices} />;
        case 'gamedev':
            return <TetrisReveal onRevealed={onRevealed} />;
        case 'digital-graphics':
            return null; // Effect moved directly to sculpture mesh via Iris Shader
        default:
            return null;
    }
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb');
    const { sculptureConfig: config, activeSlug, view } = useAppStore();
    
    // Safety check for scale and position from admin config
    const safeScale = Math.max(0.1, config.scale || 1.0);
    const safeY = Math.max(-15, Math.min(15, config.y || 0));

    // Tetris Reveal Height
    const [revealHeight, setRevealHeight] = useState(15);
    const targetVertices = useMemo(() => {
        const verts = [];
        scene.traverse(n => {
            if (n.isMesh && n.geometry.attributes.position) {
                const pos = n.geometry.attributes.position;
                for (let i = 0; i < pos.count; i += 10) { // Sample every 10th vertex
                    verts.push(new THREE.Vector3().fromBufferAttribute(pos, i));
                }
            }
        });
        return verts;
    }, [scene]);

    // Debug log
    useEffect(() => {
        if (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) {
            console.log("3D Artistic State:", { view, activeSlug });
        }
        // RESET REVEAL when changing section
        if (activeSlug === 'gamedev') setRevealHeight(-5);
        else setRevealHeight(15);
    }, [view, activeSlug]);

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(node => {
            if (node.isMesh && node.material) {
                node.material = node.material.clone();
            }
        });
        return clone;
    }, [scene]);

    // Ref for iris-shaded materials to update in useFrame without traversal
    const irisMaterials = useRef([]);

    useEffect(() => {
        irisMaterials.current = [];
        clonedScene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                const mat = node.material;
                if (mat) {
                    const isServicesOrDetail = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;
                    
                    // --- RESET TO BASE (CRITICAL BUG FIX) ---
                    mat.wireframe = false;
                    mat.opacity = 1.0;
                    mat.transparent = false;
                    mat.color.set("#ffffff");
                    mat.clippingPlanes = []; 
                    if (mat.emissive) {
                        mat.emissive.set("#000000");
                        mat.emissiveIntensity = 0;
                    }

                    // --- APPLY EFFECTS ---
                    if (isServicesOrDetail) {
                        // 1. Digital Graphics (Iris Shader)
                        if (activeSlug === 'digital-graphics') {
                            mat.wireframe = true;
                            mat.opacity = 0.9;
                            mat.transparent = true;
                            if (mat.emissive) {
                                mat.emissive.set("#ffaa44");
                                mat.emissiveIntensity = 4.0;
                            }
                            
                            irisMaterials.current.push(mat);

                            if (!mat.userData.irisApplied) {
                                mat.onBeforeCompile = (shader) => {
                                    shader.uniforms.uTime = { value: 0 };
                                    shader.uniforms.uIrisMix = { value: 1.0 }; // ADD MIX UNIFORM
                                    shader.fragmentShader = `
                                        uniform float uTime;
                                        uniform float uIrisMix;
                                        ${shader.fragmentShader}
                                    `.replace(
                                        `#include <color_fragment>`,
                                        `#include <color_fragment>
                                         vec2 uv = (vUv.x == 0.0 && vUv.y == 0.0) ? vNormal.xy : vUv;
                                         float wave = sin(uv.x * 20.0 + uTime * 2.0) * cos(uv.y * 20.0 + uTime);
                                         vec3 iris = vec3(
                                             sin(uv.x * 10.0 + uTime) * 0.5 + 0.5,
                                             sin(uv.y * 10.0 + uTime + 2.0) * 0.5 + 0.5,
                                             sin(uv.x * 10.0 - uTime + 4.0) * 0.5 + 0.5
                                         );
                                         iris = smoothstep(0.1, 0.9, iris);
                                         diffuseColor.rgb = mix(diffuseColor.rgb, iris, (0.8 + wave * 0.2) * uIrisMix);
                                        `
                                    );
                                    mat.userData.shader = shader;
                                };
                                mat.userData.irisApplied = true;
                            }
                            // Set mix to 1.0 if mode active
                            if (mat.userData.shader) {
                                mat.userData.shader.uniforms.uIrisMix.value = 1.0;
                            }
                        } 
                        // 2. Gamedev (Mask/Reveal)
                        else if (activeSlug === 'gamedev') {
                            if (!mat.userData.revealApplied) {
                                mat.onBeforeCompile = (shader) => {
                                    shader.uniforms.uRevealHeight = { value: 20 };
                                    shader.uniforms.uRevealMix = { value: 1.0 }; // ADD REVEAL MIX
                                    shader.vertexShader = `
                                        varying vec3 vWorldPos;
                                        ${shader.vertexShader}
                                    `.replace(
                                        `#include <worldpos_vertex>`,
                                        `#include <worldpos_vertex>
                                         vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                                        `
                                    );
                                    shader.fragmentShader = `
                                        uniform float uRevealHeight;
                                        uniform float uRevealMix;
                                        varying vec3 vWorldPos;
                                        ${shader.fragmentShader}
                                    `.replace(
                                        `#include <clipping_planes_fragment>`,
                                        `#include <clipping_planes_fragment>
                                         if (uRevealMix > 0.5 && vWorldPos.y > uRevealHeight) discard;
                                        `
                                    );
                                    mat.userData.revealShader = shader;
                                };
                                mat.userData.revealApplied = true;
                            }
                            mat.opacity = 0.4;
                            mat.transparent = true;
                            if (mat.userData.revealShader) {
                                mat.userData.revealShader.uniforms.uRevealMix.value = 1.0;
                            }
                        }
                    }

                    // Turn off effects if mode changed (ensuring model doesn't stay invisible)
                    if (activeSlug !== 'digital-graphics' && mat.userData.shader) {
                        mat.userData.shader.uniforms.uIrisMix.value = 0.0;
                    }
                    if (activeSlug !== 'gamedev' && mat.userData.revealShader) {
                        mat.userData.revealShader.uniforms.uRevealMix.value = 0.0;
                    }

                    mat.envMapIntensity = config.envMapIntensity ?? 0.02;
                    mat.roughness = config.roughness ?? 0.85;
                    mat.metalness = config.metalness ?? 0;
                    mat.needsUpdate = true;
                }
            }
        });
    }, [clonedScene, activeSlug, view]);

    useFrame((state) => {
        irisMaterials.current.forEach(mat => {
            if (mat.userData.shader) {
                mat.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
            }
        });
        
        // Update reveal height for Gamedev
        clonedScene.traverse(node => {
            if (node.isMesh && node.material?.userData?.revealShader) {
                node.material.userData.revealShader.uniforms.uRevealHeight.value = revealHeight;
            }
        });
    });

    const isGamedev = activeSlug === 'gamedev' && (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL);

    return (
        <Float 
            speed={isGamedev ? 0.2 : 0.4} // 2x Slower for gamedev
            rotationIntensity={isGamedev ? 0.02 : 0.05} 
            floatIntensity={isGamedev ? 0.05 : 0.1}
        >
            <Center bottom position={[0, safeY, 0]}>
                <primitive 
                    object={clonedScene} 
                    scale={safeScale} 
                    rotation={[0, config.rotationY * (Math.PI / 180), 0]} 
                />
                {(view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) && (
                    <ArtisticIntervention 
                        slug={activeSlug} 
                        targetVertices={targetVertices} 
                        onRevealed={(h) => setRevealHeight(prev => Math.max(prev, h))}
                    />
                )}
                <FlashEffect />
            </Center>
        </Float>
    );
};

const SmoothLoader = ({ progress }) => {
    const [smoothProgress, setSmoothProgress] = useState(0);
    useFrame(() => {
        setSmoothProgress(prev => THREE.MathUtils.lerp(prev, progress, 0.1));
    });
    return (
        <Html center>
            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'nowrap' }}>
                LOADING ARTIFACT... {Math.round(smoothProgress)}%
            </div>
        </Html>
    );
};

const BrutalistTotem = () => {
    const { view, activeSlug } = useAppStore();
    const { progress } = useProgress();
    
    return (
        <group>
            <TotemCameraRig />

            <Suspense fallback={<SmoothLoader progress={progress} />}>
                <ambientLight intensity={0.005} /> 
                <pointLight position={[10, 10, 10]} intensity={0.01} />
                <SculptureModel />
                
                <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={20} blur={2.5} far={10} color="#000000" />
            </Suspense>

            {/* Extremely subtle inner core glow - base level */}
            <pointLight position={[0, 1.5, 0]} intensity={0.02} color="#ffaa00" distance={10} decay={2} />
            <GoldenDust />
        </group>
    );
};

useGLTF.preload('/models/sculpture.glb');

export default BrutalistTotem;
