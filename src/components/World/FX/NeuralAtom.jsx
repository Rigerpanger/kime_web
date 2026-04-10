import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';

const LowPolyChair = ({ color, intensity }) => (
    <group scale={0.4}>
        {/* Seat */}
        <Box args={[1, 0.1, 1]} position={[0, 0.5, 0]}>
            <meshBasicMaterial color={color} wireframe transparent opacity={0.4 * intensity} />
        </Box>
        {/* Back */}
        <Box args={[1, 1, 0.1]} position={[0, 1, -0.45]}>
            <meshBasicMaterial color={color} wireframe transparent opacity={0.3 * intensity} />
        </Box>
        {/* Legs */}
        {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map((p, i) => (
            <Box key={i} args={[0.1, 1, 0.1]} position={[p[0], 0, p[1]]}>
                <meshBasicMaterial color={color} wireframe transparent opacity={0.2 * intensity} />
            </Box>
        ))}
    </group>
);

const LowPolyApple = ({ color, intensity }) => (
    <group scale={0.3}>
        <Sphere args={[1, 6, 6]}>
            <meshBasicMaterial color={color} wireframe transparent opacity={0.4 * intensity} />
        </Sphere>
        <Box args={[0.1, 0.5, 0.1]} position={[0, 1, 0]} rotation={[0, 0, 0.3]}>
            <meshBasicMaterial color={color} />
        </Box>
    </group>
);

const NeuralAtom = ({ config, modelY }) => {
    const active = config.active !== false;
    const radius = config.radius || 4.5;
    const azimuth = (config.azimuth || 45) * (Math.PI / 180);
    const intensity = config.intensity || 1.0;
    const color = new THREE.Color(config.color || '#ffcc00');
    const speed = config.speed || 1.0;
    const scale = config.scale || 0.4; // Default to a smaller, more elegant size

    const groupRef = useRef();
    const coreRef = useRef();
    const electronsRef = useRef();
    const prop1Ref = useRef();
    const prop2Ref = useRef();

    const electronCount = 8;
    const electronData = useMemo(() => {
        const data = [];
        for (let i = 0; i < electronCount; i++) {
            data.push({
                orbitSpeed: 0.5 + Math.random() * 2,
                axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
                phase: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, []);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!active || !groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        
        // Final World Position calculation
        const baseY = config.height || modelY || 9.0;
        
        // Pivot group based on radius and azimuth
        groupRef.current.position.x = Math.cos(azimuth) * radius;
        groupRef.current.position.z = Math.sin(azimuth) * radius;
        groupRef.current.position.y = baseY;

        // Core animation
        if (coreRef.current) {
            coreRef.current.scale.setScalar(scale * (1 + Math.sin(t * 3) * 0.1));
            coreRef.current.material.emissiveIntensity = intensity * (1.5 + Math.sin(t * 5) * 0.5);
        }

        // Electron animation
        if (electronsRef.current) {
            electronData.forEach((data, i) => {
                const orbR = 1.0 * (0.8 + Math.sin(t * 0.5 + i) * 0.2);
                const angle = t * data.orbitSpeed + data.phase;
                
                const x = Math.cos(angle) * orbR;
                const z = Math.sin(angle) * orbR;
                
                tempObj.position.set(x * scale, 0, z * scale);
                tempObj.position.applyAxisAngle(data.axis, Math.sin(t * 0.1));
                tempObj.scale.setScalar(0.05 * scale * (intensity * 0.5));
                tempObj.updateMatrix();
                electronsRef.current.setMatrixAt(i, tempObj.matrix);
            });
            electronsRef.current.instanceMatrix.needsUpdate = true;
        }

        // Animate side props
        if (prop1Ref.current) {
            prop1Ref.current.position.y = Math.sin(t * 0.5) * 0.5;
            prop1Ref.current.rotation.y = t * 0.2;
        }
        if (prop2Ref.current) {
            prop2Ref.current.position.y = Math.cos(t * 0.7) * 0.5;
            prop2Ref.current.rotation.y = -t * 0.3;
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            {/* Main Energy Atom */}
            <group scale={scale}>
                <mesh ref={coreRef}>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={0.8} />
                </mesh>
                <instancedMesh ref={electronsRef} args={[new THREE.SphereGeometry(1, 12, 12), null, electronCount]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity * 2} />
                </instancedMesh>
                {electronData.slice(0, 3).map((data, i) => (
                    <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.9, 0.92, 64]} />
                        <meshBasicMaterial color={color} transparent opacity={0.1 * intensity} side={THREE.DoubleSide} />
                    </mesh>
                ))}
            </group>

            {/* Narrative Props (Low-poly artifacts) */}
            <group position={[-2, 0, 1]} ref={prop1Ref}>
                <LowPolyChair color={color} intensity={intensity} />
            </group>
            <group position={[2, 1, -1]} ref={prop2Ref}>
                <LowPolyApple color={color} intensity={intensity} />
            </group>
        </group>
    );
};

export default NeuralAtom;
