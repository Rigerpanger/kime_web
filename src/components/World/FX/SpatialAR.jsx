import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Ring, Plane, Box } from '@react-three/drei';
import * as THREE from 'three';

const SpatialAR = ({ config, modelY }) => {
    const active = config.active !== false;
    const intensity = config.intensity || 1.0;
    const color = new THREE.Color(config.color || '#44aaff');
    const scale = config.scale || 1.0;
    const heightOffset = config.height || 0;
    
    const groupRef = useRef();

    const anchors = useMemo(() => [
        { id: 1, pos: [2.5, 4, 1], size: 0.2 },
        { id: 2, pos: [-2, 8, -1.5], size: 0.3 },
        { id: 3, pos: [1.2, 11, -2], size: 0.25 },
        { id: 4, pos: [-3, 2, 2], size: 0.15 },
    ], []);

    const markers = useMemo(() => [
        { id: 1, pos: [4, 6, 0], rot: [0, -Math.PI/2, 0] },
        { id: 2, pos: [-4, 4, 2], rot: [0, Math.PI/3, 0] },
    ], []);

    useFrame((state) => {
        if (!active || !groupRef.current) return;
        groupRef.current.position.y = modelY + heightOffset;
    });

    if (!active) return null;

    return (
        <group ref={groupRef} scale={scale}>
            {/* 1. Ground Spatial Mesh */}
            <group position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <gridHelper args={[10, 20, color, color]} />
                <Plane args={[10, 10]} position={[0, 0, -0.01]}>
                    <meshBasicMaterial color={color} transparent opacity={0.05 * intensity} />
                </Plane>
            </group>

            {/* 2. Pulsing Anchors */}
            {anchors.map(a => (
                <Anchor key={a.id} position={a.pos} size={a.size} color={color} intensity={intensity} />
            ))}

            {/* 3. AR Floating Markers */}
            {markers.map(m => (
                <ARMarker key={m.id} position={m.pos} rotation={m.rot} color={color} intensity={intensity} />
            ))}

            {/* 4. Scanning Panel */}
            <Html position={[3, 9, 0]} center>
                <div style={{ 
                    border: `1px solid ${color.getStyle()}`, 
                    padding: '4px 8px', 
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(5px)',
                    color: color.getStyle(),
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    whiteSpace: 'nowrap',
                    opacity: intensity
                }}>
                    <div style={{ marginBottom: '2px' }}>[ SPATIAL_MAPPING ]</div>
                    <ScanningText />
                </div>
            </Html>
        </group>
    );
};

const Anchor = ({ position, size, color, intensity }) => {
    const ringRef = useRef();
    useFrame((state) => {
        if (!ringRef.current) return;
        const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
        ringRef.current.scale.setScalar(s);
        ringRef.current.material.opacity = (1 - (s - 0.7) / 0.6) * 0.5 * intensity;
    });

    return (
        <group position={position}>
            <mesh>
                <sphereGeometry args={[size * 0.2, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <Ring ref={ringRef} args={[size, size + 0.05, 32]}>
                <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </Ring>
        </group>
    );
};

const ARMarker = ({ position, rotation, color, intensity }) => {
    const groupRef = useRef();
    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
    });

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            {/* Square Frame */}
            <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                <lineBasicMaterial color={color} transparent opacity={0.8 * intensity} />
            </lineSegments>
            <mesh>
                <planeGeometry args={[0.9, 0.9]} />
                <meshBasicMaterial color={color} transparent opacity={0.1 * intensity} side={THREE.DoubleSide} />
            </mesh>
            {/* Technical bits at corners */}
            <Box args={[0.2, 0.02, 0.02]} position={[0.4, 0.4, 0]}><meshBasicMaterial color={color} /></Box>
            <Box args={[0.02, 0.2, 0.02]} position={[0.4, 0.4, 0]}><meshBasicMaterial color={color} /></Box>
        </group>
    );
};

const ScanningText = () => {
    const [dots, setDots] = React.useState('');
    React.useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length > 2 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);
    return <span>V_SCANNING{dots}</span>;
};

export default SpatialAR;
