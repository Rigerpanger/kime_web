/* [ignoring loop detection] */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MouseSparks = () => {
    const count = 40;
    const meshRef = useRef();
    const lastTrigger = useRef(0);
    const [active, setActive] = useState(false);

    const particles = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push({
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                life: 0,
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.8, 0.5)
            });
        }
        return data;
    }, []);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!meshRef.current) return;
        
        const isClicking = state.mouse.buttons === 1;
        
        if (isClicking && state.clock.elapsedTime - lastTrigger.current > 0.1) {
            lastTrigger.current = state.clock.elapsedTime;
            
            // Raycast-like mouse to world mapping (similar to flashlight)
            const targetZ = 4.5;
            const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
            vec.unproject(state.camera);
            vec.sub(state.camera.position).normalize();
            const t = (targetZ - state.camera.position.z) / vec.z;
            const hitPos = new THREE.Vector3().copy(state.camera.position).add(vec.multiplyScalar(t));

            // Burst new particles
            particles.forEach((p, i) => {
                if (p.life <= 0) {
                    p.pos.copy(hitPos);
                    p.vel.set(
                        (Math.random() - 0.5) * 0.4,
                        (Math.random() - 0.4) * 0.4,
                        (Math.random() - 0.5) * 0.4
                    );
                    p.life = 1.0;
                }
            });
        }

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.pos.add(p.vel);
                p.vel.y -= 0.01; // Gravity
                p.life -= 0.03;

                tempObj.position.copy(p.pos);
                tempObj.scale.setScalar(p.life * 0.08);
                
                // Make spark look like a streak
                tempObj.lookAt(p.pos.clone().add(p.vel));
                tempObj.scale.z *= 4.0;
                
                tempObj.updateMatrix();
                meshRef.current.setMatrixAt(i, tempObj.matrix);
            } else {
                tempObj.scale.setScalar(0);
                tempObj.updateMatrix();
                meshRef.current.setMatrixAt(i, tempObj.matrix);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[new THREE.BoxGeometry(0.1, 0.1, 1), null, count]}>
            <meshBasicMaterial color="#ffcc00" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </instancedMesh>
    );
};

export default MouseSparks;
