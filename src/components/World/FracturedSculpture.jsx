import React, { useRef, useMemo, useEffect, Suspense } from 'react';
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

// --- ARTISTIC INTERVENTIONS (The Banksy-style effects) ---

const ScanLine = () => {
    const mesh = useRef();
    useFrame((state) => {
        if (!mesh.current) return;
        // Position relative to sculpture center
        mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 4 + 2;
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial 
                color="#ffcc00" 
                transparent 
                opacity={0.15} 
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
            />
            <gridHelper args={[10, 20, "#ffcc00", "#ffcc00"]} rotation={[Math.PI / 2, 0, 0]} opacity={0.2} transparent />
        </mesh>
    );
};

const NeuralVeins = () => {
    const group = useRef();
    const count = 20;
    const lines = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            const start = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 8 - 2, (Math.random() - 0.5) * 3);
            const end = start.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2));
            return { points: [start, end], phase: Math.random() * Math.PI * 2 };
        });
    }, []);

    useFrame((state) => {
        if (!group.current) return;
        group.current.children.forEach((child, i) => {
            const pulse = (Math.sin(state.clock.elapsedTime * 2 + lines[i].phase) + 1) / 2;
            child.material.opacity = 0.1 + pulse * 0.4;
        });
    });

    return (
        <group ref={group}>
            {lines.map((line, i) => (
                <line key={i}>
                    <bufferGeometry attach="geometry" onUpdate={self => self.setFromPoints(line.points)} />
                    <lineBasicMaterial color="#ffcc00" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
                </line>
            ))}
        </group>
    );
};

const LogicRain = () => {
    const points = useRef();
    const count = 100;
    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 4;
            pos[i * 3 + 1] = Math.random() * 10 - 2;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
            spd[i] = Math.random() * 0.05 + 0.02;
        }
        return [pos, spd];
    }, []);

    useFrame(() => {
        if (!points.current) return;
        const array = points.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            array[i * 3 + 1] -= speeds[i];
            if (array[i * 3 + 1] < -3) array[i * 3 + 1] = 7;
        }
        points.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#ffcc00" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </points>
    );
};

const ArtisticIntervention = ({ slug }) => {
    switch (slug) {
        case 'ar-vr':
            return <ScanLine />;
        case 'ai-ml':
            return <NeuralVeins />;
        case 'software-dev':
            return <LogicRain />;
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
            console.log("3D Intervention State:", { view, activeSlug });
        }
    }, [view, activeSlug]);

    const clonedScene = useMemo(() => scene.clone(), [scene]);
    
    useEffect(() => {
        clonedScene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    node.material = node.material.clone();
                    
                    // Special coloring for "Digital Graphics"
                    const isServicesOrDetail = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;
                    if (isServicesOrDetail && activeSlug === 'digital-graphics') {
                        node.material.color.set("#ffcc00");
                        node.material.wireframe = true;
                        node.material.opacity = 0.3;
                        node.material.transparent = true;
                    } else {
                        node.material.wireframe = false;
                        node.material.opacity = 1.0;
                        node.material.transparent = false;
                        node.material.color.set("#ffffff"); // Reset to white base
                    }

                    node.material.envMapIntensity = config.envMapIntensity !== undefined ? config.envMapIntensity : 0.02;
                    node.material.roughness = config.roughness !== undefined ? config.roughness : 0.85;
                    node.material.metalness = config.metalness !== undefined ? config.metalness : 0;
                    if (node.material.emissiveMap || node.material.emissive) {
                        node.material.emissiveIntensity = config.emissiveIntensity !== undefined ? config.emissiveIntensity : 1.0;
                    }
                    node.material.needsUpdate = true;
                }
            }
        });
    }, [clonedScene, config, activeSlug, view]);

    const isGamedev = activeSlug === 'gamedev' && (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL);

    return (
        <Float 
            speed={isGamedev ? 2.5 : 0.4} 
            rotationIntensity={isGamedev ? 0.8 : 0.05} 
            floatIntensity={isGamedev ? 1.5 : 0.1}
        >
            <Center bottom position={[0, config.y, 0]}>
                <primitive 
                    object={clonedScene} 
                    scale={config.scale} 
                    rotation={[0, config.rotationY * (Math.PI / 180), 0]} 
                />
                {(view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) && <ArtisticIntervention slug={activeSlug} />}
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
