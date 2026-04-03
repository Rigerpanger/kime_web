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

const SculptureModel = () => {
    const { scene } = useGLTF('/models/sculpture.glb');
    const config = useAppStore(s => s.sculptureConfig);
    
    // CRITICAL: Clone the scene to avoid caching bugs where Three.js 
    // struggles to re-mount or re-compile shaders for a dirty/disposed cached object
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    
    useEffect(() => {
        clonedScene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    // Clone the material to prevent polluting the cache
                    node.material = node.material.clone();
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
    }, [clonedScene, config.envMapIntensity, config.roughness, config.metalness, config.emissiveIntensity]);

    return (
        <Float speed={0.4} rotationIntensity={0.05} floatIntensity={0.1}>
            <Center bottom position={[0, config.y, 0]}>
                <primitive 
                    object={clonedScene} 
                    scale={config.scale} 
                    rotation={[0, config.rotationY * (Math.PI / 180), 0]} 
                />
            </Center>
        </Float>
    );
};
const BrutalistTotem = () => {
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
