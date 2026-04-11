import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LogicArchitect = ({ config, modelY }) => {
    const groupRef = useRef();
    const latticeRef = useRef();
    const pulsesRef = useRef();
    const scannerRef = useRef();

    const intensity = config.intensity ?? 1.0;
    const speed = config.speed ?? 1.0;
    const radius = config.radius ?? 1.5;
    const gridDensity = config.variant ?? 4; 
    const scanSpeed = config.speed ?? 1.0;
    const color = useMemo(() => new THREE.Color(config.color || '#00f2ff'), [config.color]);

    // --- GEOMETRY: The Modular Lattice ---
    const { cellData } = useMemo(() => {
        const cells = [];
        const dim = Math.max(2, Math.floor(gridDensity));
        const step = (radius * 1.8) / (dim - 1);
        
        for (let x = 0; x < dim; x++) {
            for (let y = 0; y < dim; y++) {
                for (let z = 0; z < dim; z++) {
                    const posX = -radius*0.9 + x * step;
                    const posY = -radius*0.9 + y * step;
                    const posZ = -radius*0.9 + z * step;
                    
                    // Simple radial culling for a nice shape
                    if (new THREE.Vector3(posX, posY, posZ).length() < radius * 1.5) {
                        cells.push({ x: posX, y: posY, z: posZ });
                    }
                }
            }
        }
        return { cellData: cells };
    }, [gridDensity, radius]);

    const pulseCount = 30;
    const pulses = useMemo(() => Array.from({ length: pulseCount }, () => ({
        pos: new THREE.Vector3((Math.random()-0.5)*radius, (Math.random()-0.5)*radius, (Math.random()-0.5)*radius),
        axis: Math.floor(Math.random() * 3),
        spd: (0.01 + Math.random() * 0.03) * speed,
        life: Math.random(),
        dir: Math.random() > 0.5 ? 1 : -1
    })), [speed, radius]);

    const pulseGeom = useMemo(() => ({
        pos: new Float32Array(pulseCount * 3),
        size: new Float32Array(pulseCount)
    }), []);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        const scanY = Math.sin(t * 0.4 * scanSpeed) * radius;

        groupRef.current.position.y = modelY - 0.5; // Lowered to head center

        if (latticeRef.current) {
            cellData.forEach((cell, i) => {
                const distToScan = Math.abs(cell.y - scanY);
                const impact = Math.exp(-distToScan * 5.0);
                const scale = 0.015 + impact * 0.04; // Responsive scale
                
                tempObj.position.set(cell.x, cell.y, cell.z);
                tempObj.scale.setScalar(scale);
                tempObj.updateMatrix();
                latticeRef.current.setMatrixAt(i, tempObj.matrix);
            });
            latticeRef.current.instanceMatrix.needsUpdate = true;
            
            // Dynamic Updates
            latticeRef.current.material.uniforms.uScanY.value = scanY;
            latticeRef.current.material.uniforms.uTime.value = t;
            latticeRef.current.material.uniforms.uIntensity.value = intensity;
            latticeRef.current.material.uniforms.uColor.value.copy(color);
        }

        if (scannerRef.current) {
            scannerRef.current.position.y = scanY;
            scannerRef.current.material.opacity = (0.2 + Math.sin(t * 8) * 0.1) * intensity;
            scannerRef.current.material.color.copy(color);
        }

        if (pulsesRef.current) {
            const posAttr = pulsesRef.current.geometry.attributes.position;
            const sizeAttr = pulsesRef.current.geometry.attributes.size;
            pulses.forEach((p, i) => {
                p.life += 0.004 * speed;
                if (p.life > 1.0) {
                    p.life = 0;
                    p.pos.set((Math.random()-0.5)*radius, (Math.random()-0.5)*radius, (Math.random()-0.5)*radius);
                }
                const v = p.spd;
                if (p.axis === 0) p.pos.x += v * p.dir;
                else if (p.axis === 1) p.pos.y += v * p.dir;
                else p.pos.z += v * p.dir;

                posAttr.array[i*3] = p.pos.x; posAttr.array[i*3+1] = p.pos.y; posAttr.array[i*3+2] = p.pos.z;
                sizeAttr.array[i] = Math.sin(p.life * Math.PI) * 0.25 * intensity;
            });
            posAttr.needsUpdate = true; sizeAttr.needsUpdate = true;
        }
        groupRef.current.rotation.y = t * 0.05;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            <instancedMesh ref={latticeRef} args={[new THREE.BoxGeometry(1, 1, 1), null, cellData.length]}>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{
                        uTime: { value: 0 },
                        uColor: { value: new THREE.Color(color) },
                        uIntensity: { value: intensity },
                        uScanY: { value: 0 }
                    }}
                    vertexShader={`
                        varying vec3 vWorldPos;
                        void main() {
                            vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                            vWorldPos = worldPos.xyz;
                            gl_Position = projectionMatrix * modelViewMatrix * worldPos;
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        uniform float uIntensity;
                        uniform float uTime;
                        uniform float uScanY;
                        varying vec3 vWorldPos;
                        void main() {
                            // Distance from scanner
                            float dist = abs(vWorldPos.y - uScanY);
                            float impact = exp(-dist * 6.0);
                            
                            // Wireframe box visual
                            vec3 grid = abs(fract(vWorldPos * 6.0) - 0.5);
                            float edge = 1.0 - smoothstep(0.0, 0.06, min(min(grid.x, grid.y), grid.z));
                            
                            // Static presence + Scan burst
                            float alpha = (0.2 + impact * 3.0) * uIntensity;
                            vec3 finalColor = mix(uColor, vec3(1.0), impact * 0.7);
                            
                            gl_FragColor = vec4(finalColor, alpha * (edge * 0.9 + 0.1) * 0.4);
                        }
                    `}
                />
            </instancedMesh>

            <points ref={pulsesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={pulseCount} array={pulseGeom.pos} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={pulseCount} array={pulseGeom.size} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{ uColor: { value: color } }}
                    vertexShader={`
                        attribute float size;
                        void main() {
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (400.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            gl_FragColor = vec4(uColor, pow(1.0 - d * 2.0, 2.0));
                        }
                    `}
                />
            </points>

            {/* SCANNER: REFINED DIGITAL PLANE */}
            <mesh ref={scannerRef} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[radius * 2.2, radius * 2.2]} />
                <meshBasicMaterial 
                    color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} 
                    depthWrite={false} side={THREE.DoubleSide}
                    map={new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/glow.png')}
                />
            </mesh>
            
            <pointLight intensity={1.5 * intensity} color={color} distance={4} />
        </group>
    );
};

export default LogicArchitect;
