import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LogicArchitect = ({ config, modelY }) => {
    const groupRef = useRef();
    const latticeRef = useRef();
    const pulsesRef = useRef();
    const scannerRef = useRef();

    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 1.5;
    const gridDensity = config.variant || 4; // 3 to 6
    const scanSpeed = config.speed || 1.0;
    const color = new THREE.Color(config.color || '#00f2ff');

    // --- GEOMETRY: The Modular Lattice ---
    const { cellData, boxPositions, boxIndices } = useMemo(() => {
        const cells = [];
        const dim = Math.floor(gridDensity);
        const step = (radius * 2) / (dim - 1);
        
        // Generate grid of cell centers
        for (let x = 0; x < dim; x++) {
            for (let y = 0; y < dim; y++) {
                for (let z = 0; z < dim; z++) {
                    const posX = -radius + x * step;
                    const posY = -radius + y * step;
                    const posZ = -radius + z * step;
                    
                    // We only keep cells within a spherical-ish bounds for a cleaner look
                    if (new THREE.Vector3(posX, posY, posZ).length() < radius * 1.2) {
                        cells.push({ x: posX, y: posY, z: posZ, offset: Math.random() });
                    }
                }
            }
        }

        return {
            cellData: cells,
            totalCount: cells.length
        };
    }, [gridDensity, radius]);

    // --- PULSES (Manhattan Flows) ---
    const pulseCount = 20;
    const pulses = useMemo(() => Array.from({ length: pulseCount }, () => ({
        pos: new THREE.Vector3(),
        axis: Math.floor(Math.random() * 3), // 0:x, 1:y, 2:z
        spd: (0.02 + Math.random() * 0.04) * speed,
        life: Math.random(),
        dir: Math.random() > 0.5 ? 1 : -1
    })), [speed]);

    const pulseGeom = useMemo(() => {
        return {
            pos: new Float32Array(pulseCount * 3),
            size: new Float32Array(pulseCount)
        };
    }, []);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        const scanY = Math.sin(t * 0.5 * scanSpeed) * radius * 1.2;

        groupRef.current.position.y = modelY;

        // --- UPDATE LATTICE INSTANCES ---
        if (latticeRef.current) {
            cellData.forEach((cell, i) => {
                const distToScan = Math.abs(cell.y - scanY);
                // Glow impact from the scanning laser
                const impact = Math.exp(-distToScan * 4.0);
                const scale = 0.02 + impact * 0.03;
                
                tempObj.position.set(cell.x, cell.y, cell.z);
                tempObj.scale.setScalar(scale);
                tempObj.updateMatrix();
                latticeRef.current.setMatrixAt(i, tempObj.matrix);
            });
            latticeRef.current.instanceMatrix.needsUpdate = true;
            latticeRef.current.material.uniforms.uScanY.value = scanY;
            latticeRef.current.material.uniforms.uTime.value = t;
        }

        // --- UPDATE SCANNER BEAM ---
        if (scannerRef.current) {
            scannerRef.current.position.y = scanY;
            scannerRef.current.material.opacity = (0.15 + Math.sin(t * 10) * 0.05) * intensity;
        }

        // --- UPDATE PULSES ---
        if (pulsesRef.current) {
            const posAttr = pulsesRef.current.geometry.attributes.position;
            const sizeAttr = pulsesRef.current.geometry.attributes.size;

            pulses.forEach((p, i) => {
                p.life += 0.005 * speed;
                if (p.life > 1.0) {
                    p.life = 0;
                    p.pos.set(
                        (Math.random()-0.5) * radius * 2,
                        (Math.random()-0.5) * radius * 2,
                        (Math.random()-0.5) * radius * 2
                    );
                    p.axis = Math.floor(Math.random() * 3);
                }

                // Grid snapping movement
                const move = p.spd;
                if (p.axis === 0) p.pos.x += move * p.dir;
                else if (p.axis === 1) p.pos.y += move * p.dir;
                else p.pos.z += move * p.dir;

                posAttr.array[i*3] = p.pos.x;
                posAttr.array[i*3+1] = p.pos.y;
                posAttr.array[i*3+2] = p.pos.z;
                sizeAttr.array[i] = Math.sin(p.life * Math.PI) * 0.2 * intensity;
            });
            posAttr.needsUpdate = true;
            sizeAttr.needsUpdate = true;
        }

        groupRef.current.rotation.y = t * 0.1;

    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* THE LATTICE CUBES */}
            <instancedMesh ref={latticeRef} args={[new THREE.BoxGeometry(1, 1, 1), null, cellData.length]}>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{
                        uTime: { value: 0 },
                        uColor: { value: color },
                        uIntensity: { value: intensity },
                        uScanY: { value: 0 },
                        uRadius: { value: radius }
                    }}
                    vertexShader={`
                        varying vec3 vPos;
                        varying float vImpact;
                        uniform float uScanY;
                        void main() {
                            vPos = (instanceMatrix * vec4(position, 1.0)).xyz;
                            float dist = abs(vPos.y - uScanY);
                            vImpact = exp(-dist * 4.0);
                            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        uniform float uIntensity;
                        varying vec3 vPos;
                        varying float vImpact;
                        void main() {
                            // Wireframe box effect in shader
                            vec3 coord = fract(vPos * 5.0);
                            float edge = step(0.9, max(max(coord.x, coord.y), coord.z));
                            
                            float alpha = (0.1 + vImpact * 2.0) * uIntensity;
                            gl_FragColor = vec4(uColor, alpha * 0.3);
                        }
                    `}
                />
            </instancedMesh>

            {/* MANHATTAN FLOW PULSES */}
            <points ref={pulsesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={pulseCount} array={pulseGeom.pos} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={pulseCount} array={pulseGeom.size} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    vertexShader={`
                        attribute float size;
                        void main() {
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (300.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            gl_FragColor = vec4(vec3(1.0), pow(1.0 - d * 2.0, 2.0));
                        }
                    `}
                    uniforms={{ uColor: { value: color } }}
                />
            </points>

            {/* SCANNER BEAM PLANE */}
            <mesh ref={scannerRef} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[radius * 2.5, radius * 2.5]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            
            <pointLight intensity={0.5 * intensity} color={color} distance={4} />
        </group>
    );
};

export default LogicArchitect;
