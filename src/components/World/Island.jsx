import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// Import designs
import GpuIsland from './Islands/GpuIsland';

import CpuIsland from './Islands/CpuIsland';

const Island = ({ position, project, onClick, isActive }) => {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Smoothly interpolate position for "Focus" effect
        const targetY = isActive ? 1 : 0;
        // Basic lerp for Y position
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

        // Scale effect on group
        const targetScale = isActive ? 1.2 : hovered ? 1.1 : 1;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    const getIslandContent = () => {
        switch (project.type) {
            case 'GPU': return <GpuIsland isActive={isActive} hovered={hovered} />;

            case 'CPU': return <CpuIsland isActive={isActive} hovered={hovered} />;
            default: return (
                <mesh>
                    <cylinderGeometry args={[1.5, 1, 0.5, 6]} />
                    <meshStandardMaterial color={isActive ? "#bc13fe" : "#2d3748"} />
                </mesh>
            );
        }
    };

    return (
        <group position={position} ref={groupRef}>
            <group
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {getIslandContent()}
            </group>

            {/* Label / Billboard */}
            <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                <div className={`transition-all duration-300 ${hovered || isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-center min-w-[150px]`}>
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase">{project.title}</h3>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-neonBlue to-transparent my-1" />
                    <p className="text-[10px] text-gray-400 font-mono">{project.category}</p>
                </div>
            </Html>
        </group>
    );
};

export default Island;
