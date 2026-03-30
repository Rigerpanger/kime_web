import React from 'react';
import { Float, Box } from '@react-three/drei';

const CpuIsland = ({ isActive, hovered }) => {
    return (
        <group>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                {/* Main Processor Base */}
                <Box args={[2, 0.2, 2]}>
                    <meshStandardMaterial color="#000" roughness={0.5} metalness={0.8} />
                </Box>

                {/* Pins / Grid */}
                <group position={[0, 0.15, 0]}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Box
                            key={i}
                            args={[0.4, 0.2, 0.4]}
                            position={[
                                (i % 3 - 1) * 0.6,
                                0,
                                (Math.floor(i / 3) - 1) * 0.6
                            ]}
                        >
                            <meshStandardMaterial
                                color={isActive && i === 4 ? "#bc13fe" : "#222"}
                                emissive={hovered && i !== 4 ? "#00f3ff" : "#000"}
                                emissiveIntensity={2}
                            />
                        </Box>
                    ))}
                </group>

                {/* Central Core (Heatsink) */}
                <Box args={[0.8, 0.5, 0.8]} position={[0, 0.5, 0]}>
                    <meshStandardMaterial
                        color="#333"
                        metalness={1}
                        roughness={0.2}
                        normalScale={[1, 1]}
                    />
                </Box>
            </Float>
        </group>
    );
};

export default CpuIsland;
