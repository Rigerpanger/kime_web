import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Box, Sphere } from '@react-three/drei';

const LittlePerson = ({ position, color, delay }) => {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            // Bounce animation
            const t = state.clock.getElapsedTime();
            ref.current.position.y = position[1] + Math.sin(t * 5 + delay) * 0.1;
        }
    });

    return (
        <group position={position} ref={ref}>
            {/* Body */}
            <mesh position={[0, 0.4, 0]}>
                <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#fcc2d7" /> {/* Skin toneish */}
            </mesh>
        </group>
    );
};

const OfficeZone = ({ isActive, hovered }) => {
    return (
        <group>
            {/* Office Base Platform */}
            <mesh position={[0, 0, 0]} receiveShadow>
                <cylinderGeometry args={[2, 2.5, 0.2, 32]} />
                <meshStandardMaterial color="#e9ecef" />
            </mesh>

            {/* Little People Team */}
            <LittlePerson position={[-0.5, 0.1, 0.5]} color="#ff6b6b" delay={0} />
            <LittlePerson position={[0.5, 0.1, 0.2]} color="#4ecc4e" delay={1} />
            <LittlePerson position={[0, 0.1, -0.5]} color="#339af0" delay={2} />

            {/* Floating Props (Computers/Screens) */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Box args={[0.6, 0.4, 0.05]} position={[0, 1.2, 0]}>
                    <meshStandardMaterial color="#333" />
                </Box>
                <Box args={[0.6, 0.4, 0.05]} position={[-0.8, 1.1, 0.5]} rotation={[0, 0.5, 0]}>
                    <meshStandardMaterial color="#333" />
                </Box>
            </Float>

            {/* Label */}
            {(hovered || isActive) && (
                <mesh position={[0, 2.5, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="yellow" />
                </mesh>
            )}
        </group>
    );
};

export default OfficeZone;
