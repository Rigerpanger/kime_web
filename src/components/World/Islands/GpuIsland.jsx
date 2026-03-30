import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Box } from '@react-three/drei';
import * as THREE from 'three';

const GpuIsland = ({ isActive, hovered }) => {
    const groupRef = useRef();

    // Random floating cubes animation
    useFrame((state, delta) => {
        if (!isActive && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.2;
        }
    });

    const materialProps = {
        color: isActive ? "#bc13fe" : hovered ? "#00f3ff" : "#4a5568",
        roughness: 0.2,
        metalness: 0.9,
        wireframe: hovered || isActive
    };

    return (
        <group ref={groupRef}>
            {/* Main Core */}
            <Box args={[1.5, 1.5, 1.5]}>
                <meshPhysicalMaterial
                    color="#2d3748"
                    roughness={0.1}
                    metalness={0.8}
                    clearcoat={1}
                />
            </Box>

            {/* Holographic Floating Elements */}
            <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
                <Box args={[0.5, 0.5, 0.5]} position={[1.2, 1, 1]}>
                    <meshStandardMaterial {...materialProps} />
                </Box>
                <Box args={[0.3, 0.3, 0.3]} position={[-1.2, -0.5, 1]}>
                    <meshStandardMaterial {...materialProps} color={isActive ? "#bc13fe" : "#00f3ff"} />
                </Box>
                <Box args={[0.4, 0.4, 0.4]} position={[0, 1.5, -1]}>
                    <meshStandardMaterial {...materialProps} />
                </Box>
            </Float>

            {/* Wireframe Aura */}
            {(hovered || isActive) && (
                <mesh>
                    <boxGeometry args={[2, 2, 2]} />
                    <meshBasicMaterial color="#bc13fe" wireframe transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
};

export default GpuIsland;
