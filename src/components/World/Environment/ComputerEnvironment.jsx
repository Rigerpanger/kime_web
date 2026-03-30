import React from 'react';
import { useTexture, Grid } from '@react-three/drei';
import * as THREE from 'three';

const ComputerEnvironment = () => {
    return (
        <group>
            {/* Main Floor / Motherboard Base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshPhysicalMaterial
                    color="#050505"
                    roughness={0.2}
                    metalness={0.8}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    envMapIntensity={1}
                />
            </mesh>

            {/* Neon Traces / Grid Lines */}
            <gridHelper
                args={[100, 50, 0x00f3ff, 0x1a1a1a]}
                position={[0, -1.98, 0]}
            />

            {/* Glowing Circuit "Traces" (Decorative) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial
                    color="#000000"
                    opacity={0.9}
                    transparent
                />
            </mesh>

            {/* Decorative Tech Blocks / Components */}
            <group position={[-10, -2, -10]}>
                <mesh position={[0, 1, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4, 2, 4]} />
                    <meshStandardMaterial color="#111" roughness={0.3} metalness={0.9} />
                </mesh>
                <mesh position={[0, 2.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[3, 3]} />
                    <meshBasicMaterial color="#bc13fe" emissive="#bc13fe" emissiveIntensity={2} />
                </mesh>
            </group>

            <group position={[10, -2, 5]}>
                <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2, 1, 8]} />
                    <meshStandardMaterial color="#111" roughness={0.3} metalness={0.9} />
                </mesh>
            </group>

            {/* Background Atmosphere */}
            <mesh position={[0, 0, -40]}>
                <planeGeometry args={[200, 100]} />
                <meshBasicMaterial color="#000" />
            </mesh>
        </group>
    );
};

export default ComputerEnvironment;
