import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useGLTF, Float, Environment, ContactShadows, Center } from '@react-three/drei';
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
        setIntensity(20);
        const t = setTimeout(() => setIntensity(0), 600);
        return () => clearTimeout(t);
    }, [activeSlug]);

    useFrame((state, delta) => {
        if (!light.current) return;
        light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, intensity, 0.15);
    });

    return (
        <pointLight
            ref={light}
            position={[0, 4.5, 1]} // At "face" height
            color="#ffffff"
            distance={15}
            decay={2}
        />
    );
};

// --- ARTISTIC INTERVENTIONS (The Kime-style Digital Art) ---

// ScanLine removed as per request for more contrasty Iris Shader directly on mesh.

const ARGhosts = () => {
    const group = useRef();
    const count = 5;
    const ghosts = useMemo(() => new Array(count).fill(0).map((_, i) => ({
        pos: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 8),
        speed: Math.random() * 0.2 + 0.1,
        type: i % 3, // 0: box, 1: sphere, 2: octahedron
        id: i
    })), []);

    useFrame((state) => {
        if (!group.current) return;
        const t = state.clock.elapsedTime;
        group.current.children.forEach((child, i) => {
            child.position.y = ghosts[i].pos.y + Math.sin(t * ghosts[i].speed) * 0.5;
            child.rotation.y += 0.01;
            child.material.wireframe = Math.sin(t * 3 + ghosts[i].id) > 0;
            child.material.opacity = 0.2 + (Math.sin(t + ghosts[i].id) + 1) * 0.2;
        });
    });

    return (
        <group ref={group}>
            {ghosts.map((g, i) => (
                <mesh key={i} position={g.pos}>
                    {g.type === 0 ? <boxGeometry args={[1.5, 1.5, 1.5]} /> : 
                     g.type === 1 ? <sphereGeometry args={[1]} /> : 
                     <octahedronGeometry args={[1.2]} />}
                    <meshBasicMaterial color="#ffaa44" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
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

const DataPipeline = () => {
    const pointsRef = useRef();
    const count = 800; // More particles for cluster effect
    const clustersCount = 8;
    
    const [positions, data, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const d = new Float32Array(count * 3); // 0: clusterId, 1: speed, 2: phase offset
        const cols = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = Math.random() * 20 - 5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            d[i * 3] = Math.floor(Math.random() * clustersCount);
            d[i * 3 + 1] = Math.random() * 0.08 + 0.04;
            d[i * 3 + 2] = Math.random() * Math.PI * 2;

            cols[i * 3] = 1;
            cols[i * 3 + 1] = 0.6;
            cols[i * 3 + 2] = 0.2;
        }
        return [pos, d, cols];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const t = state.clock.elapsedTime;
        const array = pointsRef.current.geometry.attributes.position.array;
        const colorArray = pointsRef.current.geometry.attributes.color.array;
        
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const clusterId = data[i * 3];
            const speed = data[i * 3 + 1];
            const phase = data[i * 3 + 2];

            // Core falling movement
            array[idx + 1] -= speed;

            // Clustered Trajectory Logic
            const clusterAngle = (clusterId / clustersCount) * Math.PI * 2 + t * 0.2;
            const radius = 3.5 + Math.sin(t * 0.5 + phase) * 0.5;
            
            // Particles pull towards cluster path as they pass through "active" zone
            if (array[idx + 1] > -2 && array[idx + 1] < 6) {
                const targetX = Math.cos(clusterAngle) * radius;
                const targetZ = Math.sin(clusterAngle) * radius;
                array[idx] = THREE.MathUtils.lerp(array[idx], targetX, 0.05);
                array[idx + 2] = THREE.MathUtils.lerp(array[idx + 2], targetZ, 0.05);
                
                // Color shift based on position
                colorArray[idx] = 1.0;
                colorArray[idx + 1] = 0.4 + Math.sin(t + phase) * 0.3;
                colorArray[idx + 2] = 0.1;
            }

            if (array[idx + 1] < -6) {
                array[idx + 1] = 12;
                array[idx] = (Math.random() - 0.5) * 10;
                array[idx + 2] = (Math.random() - 0.5) * 10;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.07} vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </points>
    );
};

const ArtisticIntervention = ({ slug }) => {
    switch (slug) {
        case 'ar-vr':
            return <ARGhosts />;
        case 'ai-ml':
            return <NeuralHalo />;
        case 'software-dev':
            return <DataPipeline />;
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

    // Debug log
    useEffect(() => {
        if (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) {
            console.log("3D Artistic State:", { view, activeSlug });
        }
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
                    
                    // --- RESET TO BASE ---
                    mat.wireframe = false;
                    mat.opacity = 1.0;
                    mat.transparent = false;
                    mat.color.set("#ffffff");
                    if (mat.emissive) {
                        mat.emissive.set("#000000");
                        mat.emissiveIntensity = 0;
                    }

                    // --- APPLY EFFECTS ---
                    if (isServicesOrDetail) {
                        // 1. Digital Graphics (Enhanced Iris Shader)
                        if (activeSlug === 'digital-graphics') {
                            mat.wireframe = true;
                            mat.opacity = 0.9;
                            mat.transparent = true;
                            if (mat.emissive) {
                                mat.emissive.set("#ffaa44");
                                mat.emissiveIntensity = 4.0; // Stronger glow
                            }
                            
                            // Track for animation
                            irisMaterials.current.push(mat);

                            if (!mat.userData.irisApplied) {
                                mat.onBeforeCompile = (shader) => {
                                    shader.uniforms.uTime = { value: 0 };
                                    shader.fragmentShader = `
                                        uniform float uTime;
                                        ${shader.fragmentShader}
                                    `.replace(
                                        `#include <color_fragment>`,
                                        `#include <color_fragment>
                                         float wave = sin(vUv.x * 20.0 + uTime * 2.0) * cos(vUv.y * 20.0 + uTime);
                                         vec3 iris = vec3(
                                             sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5,
                                             sin(vUv.y * 10.0 + uTime + 2.0) * 0.5 + 0.5,
                                             sin(vUv.x * 10.0 - uTime + 4.0) * 0.5 + 0.5
                                         );
                                         // High contrast sharpening
                                         iris = smoothstep(0.1, 0.9, iris);
                                         diffuseColor.rgb = mix(diffuseColor.rgb, iris, 0.8 + wave * 0.2);
                                        `
                                    );
                                    mat.userData.shader = shader;
                                };
                                mat.userData.irisApplied = true;
                            }
                        } 
                        // 2. AI Synthesis Glow
                        else if (activeSlug === 'ai-ml') {
                            if (mat.emissive) {
                                mat.emissive.set("#ffaa44");
                                mat.emissiveIntensity = 1.5;
                            }
                        }
                    }

                    // --- CONFIG / SLIDER VALUES ---
                    mat.envMapIntensity = config.envMapIntensity ?? 0.02;
                    mat.roughness = config.roughness ?? 0.85;
                    mat.metalness = config.metalness ?? 0;
                    mat.needsUpdate = true;
                }
            }
        });
    }, [clonedScene, activeSlug, view]);

    // Lightweight separate effect for slider updates
    useEffect(() => {
        clonedScene.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.envMapIntensity = config.envMapIntensity ?? 0.02;
                node.material.roughness = config.roughness ?? 0.85;
                node.material.metalness = config.metalness ?? 0;
            }
        });
    }, [clonedScene, config.envMapIntensity, config.roughness, config.metalness]);

    useFrame((state) => {
        irisMaterials.current.forEach(mat => {
            if (mat.userData.shader) {
                mat.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
            }
        });
    });

    const isGamedev = activeSlug === 'gamedev' && (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL);

    return (
        <Float 
            speed={isGamedev ? 4.5 : 0.4} 
            rotationIntensity={isGamedev ? 2.5 : 0.05} 
            floatIntensity={isGamedev ? 3.5 : 0.1}
        >
            <Center bottom position={[0, safeY, 0]}>
                <primitive 
                    object={clonedScene} 
                    scale={safeScale} 
                    rotation={[0, config.rotationY * (Math.PI / 180), 0]} 
                />
                {(view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) && (
                    <ArtisticIntervention slug={activeSlug} />
                )}
                <FlashEffect />
            </Center>
        </Float>
    );
};

const BrutalistTotem = () => {
    const { view, activeSlug } = useAppStore();
    
    return (
        <group>
            <TotemCameraRig />

            <Suspense fallback={
                <Text position={[0, 0, 0]} fontSize={0.5} color="white">
                    LOADING ARTIFACT...
                </Text>
            }>
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
