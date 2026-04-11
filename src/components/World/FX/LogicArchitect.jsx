import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LogicArchitect = ({ config, modelY }) => {
    const groupRef = useRef();
    const latticeRef = useRef();
    const scannerRef = useRef();

    const intensity = config.intensity ?? 1.0;
    const speed = config.speed ?? 1.0;
    const radius = config.radius ?? 1.6;
    const gridDensity = config.variant ?? 4; 
    const scanSpeed = (config.speed ?? 1.0) * 0.5;
    const color = useMemo(() => new THREE.Color(config.color || '#00f2ff'), [config.color]);
    
    // Position overrides from StudioEditor
    const h = config.height ?? 0;
    const ox = config.offsetX ?? 0;
    const dz = config.depth ?? 0;

    // --- CONSTRUCTION DATA (Chaos vs Order) ---
    const { particles } = useMemo(() => {
        const parts = [];
        const dim = Math.max(2, Math.floor(gridDensity));
        const count = dim * dim * dim;
        const step = (radius * 1.8) / (dim - 1);
        
        let idx = 0;
        for (let x = 0; x < dim; x++) {
            for (let y = 0; y < dim; y++) {
                for (let z = 0; z < dim; z++) {
                    const targetX = -radius * 0.9 + x * step;
                    const targetY = -radius * 0.9 + y * step;
                    const targetZ = -radius * 0.9 + z * step;

                    // Chaos starting positions (floating around)
                    const chaosX = (Math.random() - 0.5) * radius * 4.0;
                    const chaosY = (Math.random() - 0.5) * radius * 4.0;
                    const chaosZ = (Math.random() - 0.5) * radius * 4.0;

                    parts.push({
                        target: new THREE.Vector3(targetX, targetY, targetZ),
                        chaos: new THREE.Vector3(chaosX, chaosY, chaosZ),
                        rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                        rotSpeed: Math.random() * 2,
                        id: idx++
                    });
                }
            }
        }
        return { particles: parts };
    }, [gridDensity, radius]);

    const tempObj = new THREE.Object3D();
    const tempQuat = new THREE.Quaternion();

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // Absolute alignment controls
        groupRef.current.position.set(ox, modelY + h - 0.5, dz);

        // Linear scanning logic (Up and Down)
        const scanY = Math.sin(t * scanSpeed) * radius * 1.5;
        
        if (latticeRef.current) {
            particles.forEach((p, i) => {
                // Calculation of assembly progress based on vertical scanner position
                // When scan hits Y, part moves to target
                const dist = Math.abs(p.target.y - scanY);
                const isAbove = p.target.y > scanY;
                
                // Strength of 'Construction' at current slice
                let progress = Math.min(1.0, Math.exp(-dist * 3.0));
                // We keep it 'Ordered' once scanned? Or just transient? 
                // Let's make it more logical: it assembles as scan passes.
                const assemblyFactor = THREE.MathUtils.smoothstep(progress, 0.0, 0.8);

                // Lerp between Chaos and Order
                tempObj.position.lerpVectors(p.chaos, p.target, assemblyFactor);
                
                // Rotation (Chaos is spinning, Target is fixed)
                tempQuat.setFromAxisAngle(p.rotAxis, t * p.rotSpeed * (1.0 - assemblyFactor));
                tempObj.quaternion.copy(tempQuat);
                
                // Scale (Scale up on snap)
                const scale = (0.02 + assemblyFactor * 0.04) * intensity;
                tempObj.scale.setScalar(scale);

                tempObj.updateMatrix();
                latticeRef.current.setMatrixAt(i, tempObj.matrix);
            });
            latticeRef.current.instanceMatrix.needsUpdate = true;
            
            // Pass scan data to shader for glows
            latticeRef.current.material.uniforms.uScanY.value = scanY;
            latticeRef.current.material.uniforms.uTime.value = t;
            latticeRef.current.material.uniforms.uIntensity.value = intensity;
            latticeRef.current.material.uniforms.uColor.value.copy(color);
        }

        if (scannerRef.current) {
            scannerRef.current.position.y = scanY;
            scannerRef.current.material.opacity = (0.3 + Math.sin(t * 12) * 0.1) * intensity;
            scannerRef.current.material.color.copy(color);
        }

        groupRef.current.rotation.y = t * 0.04;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* THE BUILDER GRID (Assembling parts) */}
            <instancedMesh ref={latticeRef} args={[new THREE.BoxGeometry(1, 1, 1), null, particles.length]}>
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
                        varying float vDist;
                        uniform float uScanY;
                        void main() {
                            vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                            vWorldPos = worldPos.xyz;
                            vDist = abs(worldPos.y - uScanY);
                            gl_Position = projectionMatrix * modelViewMatrix * worldPos;
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        uniform float uIntensity;
                        uniform float uTime;
                        varying float vDist;
                        varying vec3 vWorldPos;
                        void main() {
                            // Assembly impact glow
                            float impact = exp(-vDist * 6.0);
                            
                            // Architectural wireframe logic
                            vec3 grid = abs(fract(vWorldPos * 8.0) - 0.5);
                            float edge = 1.0 - smoothstep(0.0, 0.06, min(min(grid.x, grid.y), grid.z));
                            
                            // High-end digital look: Shimmering edges + lock-flash
                            float glow = impact * 2.0;
                            float noise = sin(vWorldPos.x * 20.0 + uTime * 10.0) * 0.5 + 0.5;
                            
                            float alpha = (0.1 + glow + noise * 0.2) * uIntensity;
                            vec3 finalColor = mix(uColor, vec3(1.0), impact * 0.8);
                            
                            gl_FragColor = vec4(finalColor, alpha * (edge * 0.9 + 0.1) * 0.6);
                        }
                    `}
                />
            </instancedMesh>

            {/* SCANNER CONSTRUCT-BEAM (With Glow) */}
            <mesh ref={scannerRef} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[radius * 2.8, radius * 2.8]} />
                <meshBasicMaterial 
                    color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} 
                    depthWrite={false} side={THREE.DoubleSide}
                    map={new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/glow.png')}
                />
            </mesh>
            
            <pointLight intensity={2.0 * intensity} color={color} distance={4} />
        </group>
    );
};

export default LogicArchitect;
