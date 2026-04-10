import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Tetrahedron } from '@react-three/drei';
import * as THREE from 'three';

const SacredGeometry = ({ config, modelY }) => {
    const active = config.active !== false;
    const radius = config.radius || 3.0;
    const color = new THREE.Color(config.color || '#ffcc00');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const heightOffset = config.height || 0;

    const groupRef = useRef();
    const starRef1 = useRef();
    const starRef2 = useRef();

    useFrame((state) => {
        if (!active || !groupRef.current) return;
        
        const t = state.clock.elapsedTime * speed;
        
        // Position & Vertical Float
        groupRef.current.position.y = (modelY + heightOffset) + Math.sin(t * 0.5) * 0.2;
        
        // Rotating the Star Tetrahedron (Merkaba)
        if (starRef1.current) {
            starRef1.current.rotation.y = t * 0.8;
            starRef1.current.rotation.x = t * 0.3;
        }
        if (starRef2.current) {
            starRef2.current.rotation.y = -t * 0.8;
            starRef2.current.rotation.x = -t * 0.3;
        }

        // Pulsing glow
        const pulse = 0.8 + Math.sin(t * 2) * 0.2;
        groupRef.current.scale.setScalar(radius * pulse * 0.5);
    });

    if (!active) return null;

    const isDigitalMode = config.variant > 0.5; // Mode switcher

    return (
        <group ref={groupRef}>
            {/* Mode 1: Sacred Merkaba */}
            {!isDigitalMode && (
                <>
                    <Tetrahedron ref={starRef1} args={[1, 0]}>
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.8 * intensity} />
                    </Tetrahedron>
                    <Tetrahedron ref={starRef2} args={[1, 0]} rotation={[Math.PI, 0, 0]}>
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.6 * intensity} />
                    </Tetrahedron>
                </>
            )}

            {/* Mode 2: Digital Logic Cube (Software/Automation) */}
            {isDigitalMode && (
                <group ref={starRef1}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.8 * intensity} />
                    <group scale={0.7} rotation={[0, Math.PI/4, 0]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.4 * intensity} />
                    </group>
                    <group scale={0.4} rotation={[Math.PI/4, 0, Math.PI/4]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={0.3 * intensity} />
                    </group>
                </group>
            )}

            {/* External Decorative Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.2, 0.005, 16, 100]} />
                <meshBasicMaterial color={color} transparent opacity={0.2 * intensity} />
            </mesh>

            <pointLight intensity={2 * intensity} color={color} distance={radius * 2} />
        </group>
    );
};

export default SacredGeometry;
