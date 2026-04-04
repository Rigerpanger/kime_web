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

const ScanLine = () => {
    const mesh = useRef();
    useFrame((state) => {
        if (!mesh.current) return;
        // Move the scan beam up and down
        mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 4 + 3;
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0,0,0.5]}>
            <planeGeometry args={[12, 12]} />
            <meshBasicMaterial 
                color="#ffaa44" 
                transparent 
                opacity={0.3} 
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
            />
            <gridHelper args={[12, 60, "#ffaa44", "#ffaa44"]} rotation={[Math.PI / 2, 0, 0]} opacity={0.6} transparent />
        </mesh>
    );
};

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
    const group = useRef();
    const count = 40;
    const connections = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const r = 2.5 + Math.random() * 0.5;
            const top = new THREE.Vector3(Math.cos(angle) * r, 8.5, Math.sin(angle) * r);
            const mid = new THREE.Vector3(Math.cos(angle) * (r * 0.6), 6.5, Math.sin(angle) * (r * 0.6));
            const bottom = new THREE.Vector3(Math.cos(angle) * 0.3, 5.2, Math.sin(angle) * 0.3); // Touches head
            return { points: [top, mid, bottom], phase: Math.random() * Math.PI * 2 };
        });
    }, []);

    useFrame((state) => {
        if (!group.current) return;
        const t = state.clock.elapsedTime;
        group.current.children.forEach((child, i) => {
            const pulse = (Math.sin(t * 1.5 + connections[i].phase) + 1) / 2;
            child.material.opacity = pulse * 0.4;
            child.scale.setScalar(0.95 + pulse * 0.1);
        });
    });

    return (
        <group ref={group}>
            {connections.map((conn, i) => (
                <line key={i}>
                    <bufferGeometry attach="geometry" onUpdate={self => self.setFromPoints(conn.points)} />
                    <lineBasicMaterial color="#ffaa44" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
                </line>
            ))}
            {/* Halo Ring */}
            <mesh position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.5, 0.015, 16, 100]} />
                <meshBasicMaterial color="#ffaa44" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
};

const DataPipeline = () => {
    const pointsRef = useRef();
    const count = 600;
    const [positions, data] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const d = new Float32Array(count * 2); // 0: phase, 1: speed
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 8;
            pos[i * 3 + 1] = Math.random() * 15 - 5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
            d[i * 2] = Math.random() * Math.PI * 2;
            d[i * 2 + 1] = Math.random() * 0.05 + 0.05;
        }
        return [pos, d];
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const t = state.clock.elapsedTime;
        const array = pointsRef.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            // Phase 1: Chaos (falling)
            array[idx + 1] -= data[i * 2 + 1];
            
            // Phase 2: Structural Pipeline (if y is between 1 and 4)
            if (array[idx + 1] > 1 && array[idx + 1] < 4) {
                const angle = data[i * 2];
                array[idx] = THREE.MathUtils.lerp(array[idx], Math.cos(t * 0.5 + angle) * 4, 0.02);
                array[idx + 2] = THREE.MathUtils.lerp(array[idx + 2], Math.sin(t * 0.5 + angle) * 4, 0.02);
            }

            if (array[idx + 1] < -5) {
                array[idx + 1] = 10;
                array[idx] = (Math.random() - 0.5) * 8;
                array[idx + 2] = (Math.random() - 0.5) * 8;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.06} color="#ffaa44" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
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
            return <ScanLine />; // Add scanline as back backup
        default:
            return null;
    }
};

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb');
    const { sculptureConfig: config, activeSlug, view } = useAppStore();
    
    // Debug log to help identify why effects might not trigger
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
                        // 1. Digital Graphics (Iris Shader)
                        if (activeSlug === 'digital-graphics') {
                            mat.wireframe = true;
                            mat.opacity = 0.8;
                            mat.transparent = true;
                            if (mat.emissive) {
                                mat.emissive.set("#ffaa44");
                                mat.emissiveIntensity = 2.0;
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
                                         vec3 iris = vec3(
                                             sin(vUv.x * 5.0 + uTime) * 0.5 + 0.5,
                                             sin(vUv.y * 5.0 + uTime + 2.0) * 0.5 + 0.5,
                                             sin(vUv.x * 5.0 - uTime + 4.0) * 0.5 + 0.5
                                         );
                                         diffuseColor.rgb = mix(diffuseColor.rgb, iris, 0.6);
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

    // Lightweight separate effect for slider updates (no material cloning, no re-compile)
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
            <Center bottom position={[0, config.y, 0]}>
                <primitive 
                    object={clonedScene} 
                    scale={config.scale} 
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
