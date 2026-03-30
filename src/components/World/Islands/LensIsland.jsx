import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Torus } from '@react-three/drei';
import * as THREE from 'three';

const LensIsland = ({ isActive, hovered }) => {
    const ringRef = useRef();

    useFrame((state, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.x += delta * 0.5;
            ringRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                {/* Main Lens Body */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.2, 1.2, 0.5, 32]} />
                    <meshPhysicalMaterial
                        color="#111"
                        roughness={0}
                        metalness={1}
                        clearcoat={1}
                    />
                </mesh>

                {/* Glass Element */}
                <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.2]} />
                    <meshPhysicalMaterial
                        color={isActive ? "#bc13fe" : "#00f3ff"}
                        roughness={0.1}
                        metalness={0.1}
                        transparent
                        opacity={0.3}
                    />
                </mesh>

                {/* Orbiting Ring */}
                <group ref={ringRef}>
                    <Torus args={[1.8, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                        <meshStandardMaterial
                            color={hovered ? "#fff" : "#444"}
                            emissive={hovered ? "#fff" : "#000"}
                            emissiveIntensity={2}
                        />
                    </Torus>
                </group>
            </Float>
        </group>
    );
};

export default LensIsland;
