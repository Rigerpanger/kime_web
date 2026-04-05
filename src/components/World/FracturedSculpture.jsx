import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useGLTF, Float, Center, Html, useProgress, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';

// FX Components Dictionary
const FX_COMPONENTS = {
    'NeuralCore': (props) => <NeuralCore {...props} />,
    'ShapeShifter': (props) => <ShapeShifter {...props} />,
    'SoftwareSilhouette': (props) => <SoftwareSilhouette {...props} />,
    'TetrisReveal': (props) => <TetrisReveal {...props} />,
    'Iris': () => null,
    'None': () => null
};

// A spotlight that stays focused on the model group
// Wrapper for positioning and transition logic
const FXWrapper = ({ type, config, isActive, onRevealed }) => {
    const opacityRef = useRef(0);
    const FXComp = FX_COMPONENTS[type];
    
    useFrame((state, delta) => {
        const target = isActive ? 1.0 : 0.0;
        opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, delta * 2.0);
    });

    if (opacityRef.current < 0.01 && !isActive) return null;
    if (!FXComp) return null;

    // --- ORBITAL POSITIONING LOGIC ---
    // Spatial FX: NeuralCore, ShapeShifter, SoftwareSilhouette
    // Non-Spatial FX: Iris, TetrisReveal (Shader-only)
    const isSpatial = ['NeuralCore', 'ShapeShifter', 'SoftwareSilhouette'].includes(type);
    
    let position = [0, 4.8, 0];
    if (isSpatial) {
        const azimuth = (config.azimuth || 0) * Math.PI / 180;
        const radius = config.radius !== undefined ? config.radius : 4.5;
        const height = config.height !== undefined ? config.height : 4.8;
        
        position = [
            radius * Math.sin(azimuth),
            height,
            radius * Math.cos(azimuth)
        ];
    } else {
        // Fallback for non-spatial or legacy
        position = Array.isArray(config.pos) ? config.pos : [0, 0, 0];
    }

    return (
        <group position={position}>
            <FXComp config={config} animatedOpacity={opacityRef.current} onRevealed={onRevealed} />
        </group>
    );
};

// --- EFFECT: AI (NeuralCore) ---
const NeuralCore = ({ config = {}, animatedOpacity = 1 }) => {
    const coreRef = useRef();
    const groupRef = useRef();

    const particles = useMemo(() => {
        const count = 300;
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorObj = new THREE.Color(config.color || "#ffcc00");
        
        for (let i = 0; i < count; i++) {
            const r = 2.5 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = r * Math.cos(phi);
            colorObj.toArray(colors, i * 3);
        }
        return { pos, colors };
    }, [config.color]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            coreRef.current.rotation.y = t * 0.5;
            coreRef.current.rotation.z = t * 0.3;
            coreRef.current.scale.setScalar((1 + Math.sin(t * 3) * 0.1) * (config.scale || 1.0));
        }
        if (groupRef.current) {
            groupRef.current.rotation.y = t * -0.2;
        }
    });

    return (
        <group>
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial color={config.color || "#ffcc00"} wireframe transparent opacity={animatedOpacity} />
            </mesh>
            <group ref={groupRef}>
                <points>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={300} array={particles.pos} itemSize={3} />
                        <bufferAttribute attach="attributes-color" count={300} array={particles.colors} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial size={0.08} vertexColors transparent opacity={animatedOpacity * 0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
                </points>
            </group>
        </group>
    );
};

// --- EFFECT: ShapeShifter ---
const ShapeShifter = ({ config = {}, animatedOpacity = 1 }) => {
    const meshRef = useRef();
    const [shape, setShape] = useState(0); 
    
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.5;
            meshRef.current.scale.setScalar(config.scale || 1.0);
            meshRef.current.material.opacity = (0.5 + Math.sin(t * 2) * 0.3) * (config.intensity || 1.0) * animatedOpacity;
            if (Math.floor(t / 3) % 4 !== shape) setShape(Math.floor(t / 3) % 3);
        }
    });

    return (
        <mesh ref={meshRef}>
            {shape === 0 ? <boxGeometry args={[2 * (config.scale || 1), 2 * (config.scale || 1), 2 * (config.scale || 1)]} /> : 
             shape === 1 ? <sphereGeometry args={[1.5 * (config.scale || 1), 32, 32]} /> : 
             <coneGeometry args={[1.5 * (config.scale || 1), 2.5 * (config.scale || 1), 4]} />}
            <meshBasicMaterial color={config.color || "#ffaa44"} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

// --- EFFECT: Gamedev Reveal ---
const TetrisReveal = ({ config = {}, animatedOpacity = 1, onRevealed }) => {
    const [blocks, setBlocks] = useState([]);
    const meshes = useRef([]);
    const landedCount = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBlocks(prev => {
                if (prev.length >= 6) return prev;
                return [...prev, { id: Math.random(), pos: [ (Math.random() - 0.5) * 4, 15, (Math.random() - 0.5) * 4 ], speed: 0.15, landed: false }];
            });
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    useFrame(() => {
        let currentLanded = 0;
        blocks.forEach((b, i) => {
            const mesh = meshes.current[i];
            if (!mesh) return;
            if (!b.landed) {
                mesh.position.y -= b.speed;
                if (mesh.position.y <= -2) {
                    b.landed = true;
                    landedCount.current++;
                }
            } else {
                mesh.position.y = -2;
                currentLanded++;
            }
        });
        const h = -5 + (currentLanded * (17 / 6));
        if (onRevealed) onRevealed(h);
    });

    const safePos = Array.isArray(config.pos) ? config.pos : [0, 0, 0];
    return (
        <group scale={config.scale || 1.0}>
            {blocks.map((b, i) => (
                <mesh key={b.id} ref={el => meshes.current[i] = el} position={b.pos}>
                    <boxGeometry args={[2.5, 2.5, 2.5]} />
                    <meshBasicMaterial color={config.color || "#ffaa44"} transparent opacity={0.7 * (config.intensity || 1.0) * animatedOpacity} blending={THREE.AdditiveBlending} />
                </mesh>
            ))}
        </group>
    );
};

// --- EFFECT: Software Silhouette ---
const SoftwareSilhouette = ({ config = {}, animatedOpacity = 1 }) => {
    const pointsRef = useRef();
    const count = 500;
    
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const offsets = new Float32Array(count); 
        const lanes = new Float32Array(count); 
        const speeds = new Float32Array(count);
        
        for(let i=0; i<count; i++) {
            offsets[i] = Math.random() * Math.PI * 2;
            const laneType = Math.floor(Math.random() * 4); 
            lanes[i] = 3.5 + laneType * 1.5; 
            pos[i*3 + 1] = (Math.random() - 0.5) * 8.0; 
            speeds[i] = 0.4 + Math.random() * 0.4;
            
            // Cluster logic (5-10 particles grouped together)
            if (i > 0 && Math.random() < 0.85) {
                offsets[i] = offsets[i-1] + (Math.random() - 0.5) * 0.15;
                lanes[i] = lanes[i-1];
                pos[i*3 + 1] = pos[(i-1)*3 + 1] + (Math.random() - 0.5) * 0.8;
                speeds[i] = speeds[i-1];
            }
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
        geo.setAttribute('aLane', new THREE.BufferAttribute(lanes, 1));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        return geo;
    }, []);

    const material = useMemo(() => {
        const p = Array.isArray(config.pos) ? config.pos : [0, 4.8, 0];
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 },
                uColorStart: { value: new THREE.Color("#00aaff") },
                uColorEnd: { value: new THREE.Color("#ffdd00") },
                uCenter: { value: new THREE.Vector3(p[0], p[1], p[2]) },
                uScale: { value: config.scale || 1.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec3 uCenter;
                uniform float uScale;
                attribute float aOffset;
                attribute float aLane;
                attribute float aSpeed;
                varying float vProgress;
                void main() {
                    float angle = aOffset + uTime * aSpeed;
                    vProgress = fract(angle / (3.14159 * 2.0));
                    vec3 p = position;
                    p.x = cos(angle) * aLane * uScale;
                    p.z = sin(angle) * aLane * uScale;
                    p += uCenter;
                    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = (15.0 * uScale / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uOpacity;
                uniform vec3 uColorStart;
                uniform vec3 uColorEnd;
                varying float vProgress;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    vec3 finalColor = mix(uColorStart, uColorEnd, sin(vProgress * 3.14159));
                    gl_FragColor = vec4(finalColor, uOpacity * (1.0 - dist * 2.0));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }, [config.pos, config.scale]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
            pointsRef.current.material.uniforms.uOpacity.value = animatedOpacity * (config.intensity || 1.0);
            pointsRef.current.material.uniforms.uScale.value = config.scale || 1.0;
        }
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
};

const UnifiedShaderInjection = (mat) => {
    if (mat.userData.unifiedCompiled) return;
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uIrisMix = { value: 0 };
        shader.uniforms.uRevealMix = { value: 0 };
        shader.uniforms.uRevealHeight = { value: 15 };
        
        shader.vertexShader = `
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            ${shader.vertexShader}
        `.replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>
            vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            vNormalVec = normalize(normalMatrix * normal);
            vViewPos = -mvPosition.xyz;
        `);

        shader.fragmentShader = `
            uniform float uTime;
            uniform float uIrisMix;
            uniform float uRevealMix;
            uniform float uRevealHeight;
            varying vec3 vWorldPos;
            varying vec3 vNormalVec;
            varying vec3 vViewPos;
            ${shader.fragmentShader}
        `.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>
            if (uRevealMix > 0.5 && vWorldPos.y > uRevealHeight) discard;
        `).replace(`#include <color_fragment>`, `#include <color_fragment>
            float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormalVec), normalize(vViewPos))), 2.0);
            vec3 baseIris = vec3(
                sin(vWorldPos.x * 2.0 + uTime * 1.5) * 0.5 + 0.5,
                sin(vWorldPos.y * 2.0 + uTime * 1.2 + 2.0) * 0.5 + 0.5,
                sin(vWorldPos.z * 2.0 - uTime * 0.8 + 4.0) * 0.5 + 0.5
            );
            baseIris = pow(baseIris, vec3(0.6)) * 1.5; 
            vec3 fatGlow = baseIris * 1.2 + vec3(1.0, 0.85, 0.95) * fresnel * 1.5;
            diffuseColor.rgb = mix(diffuseColor.rgb, fatGlow, uIrisMix * 0.95);
        `);
        mat.userData.shader = shader;
    };
    mat.userData.unifiedCompiled = true;
};

const SculptureModel = () => {
    // Enable Draco decompression for 10x faster loading and GPU upload
    const { scene } = useGLTF('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const { sculptureConfig: config, activeSlug, view, showStudioEditor } = useAppStore();
    const [revealHeight, setRevealHeight] = useState(15);

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse(n => { if (n.isMesh) UnifiedShaderInjection(n.material); });
        return clone;
    }, [scene]);

    useFrame((state) => {
        clonedScene.traverse(n => {
            const shader = n.material?.userData?.shader;
            if (shader) {
                shader.uniforms.uTime.value = state.clock.elapsedTime;
                shader.uniforms.uIrisMix.value = activeSlug === 'digital-graphics' ? 1.0 : 0;
                shader.uniforms.uRevealMix.value = activeSlug === 'gamedev' ? 1.0 : 0;
                shader.uniforms.uRevealHeight.value = revealHeight;
            }
            if (n.isMesh) {
                n.material.envMapIntensity = config.envMapIntensity ?? 0.02;
                n.material.opacity = activeSlug === 'gamedev' ? 0.4 : 1.0;
                n.material.transparent = activeSlug === 'gamedev';
            }
        });
    });

    const isServiceView = view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL;
    // Disable floating when in editor to ensure accurate camera framing
    const isEditing = showStudioEditor;

    useEffect(() => {
        // Fallback injection to manually restore the 3D scene from browser JS console
        window.resetSculpture = () => {
            useAppStore.setState({ 
                sculptureConfig: { 
                    ...useAppStore.getState().sculptureConfig, 
                    y: 5.1, 
                    scale: 17, 
                    rotationY: 248 
                } 
            });
            console.log("Model parameters forcibly reset! (y, scale, rotation restored to safety values)");
        };
    }, []);

    // Defensive parsing against destructive DB string/null formats
    const currentSection = config.sections?.[activeSlug] || config.sections?.default;
    
    // Use section-specific scale and height, falling back to global if needed
    let safeScale = currentSection?.scale ?? config?.scale ?? 17;
    let safeY = currentSection?.modelY ?? config?.y ?? 5.1;
    
    if (safeScale < 0.1 || safeScale > 500) safeScale = 17; // prevent vanishing bounds
    const safeRot = Number.isFinite(Number(config?.rotationY)) ? Number(config.rotationY) : 248;

    return (
        <Float 
            speed={isEditing ? 0 : 0.4} 
            rotationIntensity={isEditing ? 0 : 0.5} 
            floatIntensity={isEditing ? 0 : 0.5}
        >
            <group position={[0, safeY, 0]}>
                <Center bottom>
                    <primitive 
                        object={clonedScene} 
                        scale={safeScale} 
                        rotation={[0, THREE.MathUtils.degToRad(safeRot), 0]}
                    />
                    
                    {/* NEW DYNAMIC FX SYSTEM */}
                    {(currentSection?.fx || []).map(fx => (
                        <FXWrapper 
                            key={fx.id}
                            type={fx.type}
                            config={fx}
                            isActive={fx.active}
                        />
                    ))}
                </Center>
            </group>
        </Float>
    );
};

const SmoothLoader = ({ progress }) => {
    const [pseudo, setPseudo] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setPseudo(p => p < 98 ? p + (100-p)*0.01 : p), 200);
        return () => clearInterval(interval);
    }, []);
    return (
        <Html center>
            <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '13px', textAlign: 'center', letterSpacing: '4px' }}>
                LOADING_ARTIFACT<br/>{Math.round(Math.max(progress, pseudo))}%
            </div>
        </Html>
    );
};

const BrutalistTotem = () => {
    const { progress } = useProgress();
    return (
        <group>
            <Suspense fallback={<SmoothLoader progress={progress} />}>
                <SculptureModel />
                <ContactShadows position={[0, -5, 0]} opacity={0.3} scale={20} blur={2.5} far={10} color="#000000" />
            </Suspense>
            <pointLight position={[0, 1.5, 0]} intensity={0.02} color="#ffaa00" distance={10} decay={2} />
        </group>
    );
};

useGLTF.preload('/models/sculpture.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
export default BrutalistTotem;
