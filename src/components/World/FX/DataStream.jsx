/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DataStream = ({ config, modelY }) => {
    const active = config.active;
    const count = 50;
    const color = new THREE.Color(config.color || '#ffcc00');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 3.0;

    const streamsRef = useRef();

    const streamData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push({
                x: (Math.random() - 0.5) * radius * 2,
                z: (Math.random() - 0.5) * radius * 2,
                y: Math.random() * 20 - 10,
                len: 0.5 + Math.random() * 2,
                spd: 0.1 + Math.random() * 0.3
            });
        }
        return data;
    }, [count, radius]);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!active || !streamsRef.current) return;
        const t = state.clock.elapsedTime * speed;
        const centerPos = config.height ?? modelY ?? 5.1;
        streamsRef.current.position.y = centerPos;

        streamData.forEach((d, i) => {
            let y = d.y - t * d.spd * 50.0;
            while (y < -10) y += 20;
            
            tempObj.position.set(d.x, y, d.z);
            tempObj.scale.set(0.01, d.len, 0.01);
            tempObj.updateMatrix();
            streamsRef.current.setMatrixAt(i, tempObj.matrix);
        });
        streamsRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <instancedMesh ref={streamsRef} args={[new THREE.BoxGeometry(1, 1, 1), null, count]}>
            <meshBasicMaterial color={color} transparent opacity={0.4 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
    );
};

export default DataStream;
