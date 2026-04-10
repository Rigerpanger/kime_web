import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Box, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';

const EngineGizmo = ({ config, modelY }) => {
    const active = config.active !== false;
    const intensity = config.intensity || 1.0;
    const color = new THREE.Color(config.color || '#00ffcc');
    const scale = config.scale || 1.0;
    const heightOffset = config.height || 0;
    
    const groupRef = useRef();
    const floatingItemsRef = useRef([]);

    const floatingItems = useMemo(() => [
        { type: 'box', pos: [3, 2, -2], size: 0.4, speed: 0.5 },
        { type: 'sphere', pos: [-3, 4, 3], size: 0.3, speed: 0.8 },
        { type: 'cone', pos: [2, 6, 2], size: 0.4, speed: 0.4 },
        { type: 'box', pos: [-2, 8, -3], size: 0.2, speed: 1.2 },
    ], []);

    const xpPopups = useMemo(() => [
        { id: 1, offset: [0.5, 2, 0], delay: 0 },
        { id: 2, offset: [-0.3, 3, 0.2], delay: 1.5 },
        { id: 3, offset: [0.2, 4, -0.5], delay: 3 },
    ], []);

    useFrame((state) => {
        if (!active || !groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // Apply position
        groupRef.current.position.y = modelY + heightOffset;
        
        // Animate floating primitives
        floatingItemsRef.current.forEach((item, i) => {
            if (!item) return;
            const data = floatingItems[i];
            item.position.y = data.pos[1] + Math.sin(t * data.speed) * 0.5;
            item.rotation.x = t * 0.5 * intensity;
            item.rotation.y = t * 0.3 * intensity;
        });
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            {/* 1. Bounding Box - Dynamic Scale */}
            <Box args={[6 * scale, 12 * scale, 6 * scale]}>
                <meshBasicMaterial color={color} wireframe transparent opacity={0.2 * intensity} />
            </Box>

            {/* 2. Floating Blockout Primitives */}
            {floatingItems.map((data, i) => (
                <group key={i} ref={el => floatingItemsRef.current[i] = el} position={[data.pos[0] * scale, data.pos[1], data.pos[2] * scale]}>
                    {data.type === 'box' && <Box args={[data.size * scale, data.size * scale, data.size * scale]}><meshBasicMaterial color={color} wireframe /></Box>}
                    {data.type === 'sphere' && <Sphere args={[data.size * scale, 16, 16]}><meshBasicMaterial color={color} wireframe /></Sphere>}
                    {data.type === 'cone' && <Cone args={[data.size * scale, data.size * scale * 2, 16]}><meshBasicMaterial color={color} wireframe /></Cone>}
                </group>
            ))}

            {/* 3. XYZ Axis Gizmo at base */}
            <group position={[0, -5.5 * scale, 0]} scale={scale}>
                <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                    <cylinderGeometry args={[0.02, 0.02, 2]} />
                    <meshBasicMaterial color="#ff4444" />
                </mesh>
                <mesh position={[0, 1, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 2]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
                <mesh position={[0, 0, 1]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 2]} />
                    <meshBasicMaterial color="#4444ff" />
                </mesh>
            </group>

            {/* 4. Game HUD Elements */}
            <Html position={[0, 7.5 * scale, 0]} center>
                <div style={{ pointerEvents: 'none', userSelect: 'none', textAlign: 'center', opacity: intensity }}>
                    <div style={{ 
                        width: `${120 * scale}px`, height: '6px', 
                        background: 'rgba(0,0,0,0.5)', border: '1px solid white',
                        borderRadius: '3px', overflow: 'hidden',
                        marginBottom: '4px'
                    }}>
                        <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #ff4444, #44ff44)' }} />
                    </div>
                    <div style={{ color: 'white', fontSize: `${Math.max(8, 10 * scale)}px`, fontWeight: 'bold', textShadow: '0 0 5px black' }}>
                        SCULPTURE_LVL_99
                    </div>
                </div>
            </Html>

            {/* Rising XP Popups */}
            {xpPopups.map(p => (
                <XPText key={p.id} offset={[p.offset[0] * scale, p.offset[1] * scale, p.offset[2] * scale]} delay={p.delay} />
            ))}
        </group>
    );
};

const XPText = ({ offset, delay }) => {
    const ref = useRef();
    useFrame((state) => {
        if (!ref.current) return;
        const t = (state.clock.elapsedTime + delay) % 4;
        const progress = t / 4;
        ref.current.style.transform = `translateY(${-progress * 100}px)`;
        ref.current.style.opacity = Math.sin(progress * Math.PI);
    });

    return (
        <Html position={offset}>
            <div ref={ref} style={{ 
                color: '#ffcc00', fontSize: '14px', fontWeight: '900', 
                whiteSpace: 'nowrap', pointerEvents: 'none',
                textShadow: '0 0 10px rgba(255,204,0,0.8)'
            }}>
                +250 XP
            </div>
        </Html>
    );
};

export default EngineGizmo;
