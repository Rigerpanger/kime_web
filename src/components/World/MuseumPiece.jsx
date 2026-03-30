import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, MeshDistortMaterial, Float, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Multi-Map Texture Generator
const generateBakedTexture = () => {
    const size = 4096;

    // 3 Canvases for PBR Channels
    const cColor = document.createElement('canvas'); cColor.width = size; cColor.height = size;
    const ctxColor = cColor.getContext('2d');

    const cEmissive = document.createElement('canvas'); cEmissive.width = size; cEmissive.height = size;
    const ctxEmissive = cEmissive.getContext('2d');

    const cRough = document.createElement('canvas'); cRough.width = size; cRough.height = size;
    const ctxRough = cRough.getContext('2d');

    // --- 1. Base Setup ---
    // Color: Grey Concrete (Neutral)
    ctxColor.fillStyle = '#b0b0b0'; ctxColor.fillRect(0, 0, size, size);
    // Emissive: Black
    ctxEmissive.fillStyle = '#000000'; ctxEmissive.fillRect(0, 0, size, size);
    // Roughness: High (Matte)
    ctxRough.fillStyle = '#dddddd'; ctxRough.fillRect(0, 0, size, size);

    // --- 2. Concrete Detail (Pores & Grain) ---
    // High frequency noise
    const imgDataC = ctxColor.getImageData(0, 0, size, size);
    const dataC = imgDataC.data;

    // We'll iterate manually for speed (and simple grain)
    for (let i = 0; i < dataC.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        dataC[i] += noise;
        dataC[i + 1] += noise;
        dataC[i + 2] += noise;
    }
    ctxColor.putImageData(imgDataC, 0, 0);

    // Dark Pores (The "Sponge" look of concrete)
    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2 + 1;
        ctxColor.fillStyle = 'rgba(0,0,0,0.3)';
        ctxColor.beginPath(); ctxColor.arc(x, y, r, 0, Math.PI * 2); ctxColor.fill();

        // Pores are rough
        ctxRough.fillStyle = '#ffffff';
        ctxRough.beginPath(); ctxRough.arc(x, y, r, 0, Math.PI * 2); ctxRough.fill();
    }

    // --- 3. PAINT (Flowing, Organic) ---
    const drawPaintStrip = (startX, startY, color, width, flowLength) => {
        ctxColor.fillStyle = color;
        ctxRough.fillStyle = '#111111'; // Glossy

        let cx = startX;
        let cy = startY;
        let w = width;

        // Draw head
        const drawBlob = (x, y, r) => {
            ctxColor.beginPath(); ctxColor.arc(x, y, r, 0, Math.PI * 2); ctxColor.fill();
            ctxRough.beginPath(); ctxRough.arc(x, y, r, 0, Math.PI * 2); ctxRough.fill();
        };

        drawBlob(cx, cy, w); // Main splash

        // Drips descending
        const drips = 3;
        for (let d = 0; d < drips; d++) {
            let dx = cx + (Math.random() - 0.5) * w;
            let dy = cy;
            let dw = w * (0.2 + Math.random() * 0.3);
            let len = flowLength * (0.5 + Math.random() * 0.5);

            ctxColor.beginPath();
            ctxColor.roundRect(dx - dw / 2, dy, dw, len, dw / 2);
            ctxColor.fill();

            ctxRough.beginPath();
            ctxRough.roundRect(dx - dw / 2, dy, dw, len, dw / 2);
            ctxRough.fill();

            // End bulb
            drawBlob(dx, dy + len, dw * 1.2);
        }
    };

    // RED (Massive splash top left)
    drawPaintStrip(size * 0.3, size * 0.4, '#e63900', 300, 800);

    // BLUE (Right side)
    drawPaintStrip(size * 0.75, size * 0.5, '#0077cc', 250, 600);

    // YELLOW (Bottom Center - Emerging)
    drawPaintStrip(size * 0.5, size * 0.7, '#ffcc00', 200, 500);


    // --- 4. MAGMA FISSURES (Glowing Cracks) ---
    // Visualized as a lightning bolt style crack
    ctxEmissive.shadowBlur = 30;
    ctxEmissive.shadowColor = '#ff6600';
    ctxEmissive.strokeStyle = '#ffaa00'; // Hot Core
    ctxEmissive.lineWidth = 8;
    ctxEmissive.lineJoin = 'round';
    ctxEmissive.lineCap = 'round';

    const drawCrack = (pts) => {
        ctxEmissive.beginPath();
        ctxEmissive.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctxEmissive.lineTo(pts[i][0], pts[i][1]);
        ctxEmissive.stroke();
    };

    // Main Crack (Vertical-ish)
    let cx = size * 0.45;
    let cy = 0;
    let points = [];
    while (cy < size) {
        points.push([cx, cy]);
        cx += (Math.random() - 0.5) * 150;
        cy += Math.random() * 150 + 50;
    }
    drawCrack(points);

    // Branching Crack
    if (points.length > 5) {
        let branchStart = points[Math.floor(points.length / 2)];
        let bx = branchStart[0];
        let by = branchStart[1];
        ctxEmissive.lineWidth = 4;
        ctxEmissive.beginPath();
        ctxEmissive.moveTo(bx, by);
        for (let k = 0; k < 10; k++) {
            bx += 80;
            by += (Math.random() - 0.5) * 100;
            ctxEmissive.lineTo(bx, by);
        }
        ctxEmissive.stroke();
    }

    const tColor = new THREE.CanvasTexture(cColor);
    const tEmiss = new THREE.CanvasTexture(cEmissive);
    const tRough = new THREE.CanvasTexture(cRough);

    [tColor, tEmiss, tRough].forEach(t => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1); // 1:1 Mapping to keep splats positioned uniquely
        t.minFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
    });

    return { map: tColor, emissiveMap: tEmiss, roughnessMap: tRough };
};

const MuseumPiece = () => {
    const sculptureRef = useRef();

    // Generate textures
    const { map, emissiveMap, roughnessMap } = useMemo(() => generateBakedTexture(), []);

    useFrame((state, delta) => {
        if (sculptureRef.current) {
            sculptureRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group position={[0, -2, 0]}>
            {/* Pedestal - Darker to contrast */}
            <mesh position={[0, -2.5, 0]} receiveShadow castShadow>
                <boxGeometry args={[3.2, 2, 3.2]} />
                <meshStandardMaterial
                    color="#444"
                    roughness={1}
                />
            </mesh>

            {/* Float Core */}
            <Float speed={1} rotationIntensity={0.05} floatIntensity={0.1}>
                <group position={[0, 1.2, 0]} ref={sculptureRef}>
                    {/* Inner Light source */}
                    <pointLight position={[0, 0, 0]} intensity={8} color="#ff8800" distance={6} decay={2} />

                    <Torus args={[2.2, 1.2, 128, 256]}>
                        <meshPhysicalMaterial
                            map={map}
                            emissiveMap={emissiveMap}
                            emissive="#ffffff"
                            emissiveIntensity={3}
                            roughnessMap={roughnessMap}
                            roughness={1}
                            metalness={0.0}
                            bumpMap={map}
                            bumpScale={0.02}
                        />
                    </Torus>
                </group>
            </Float>
        </group>
    );
};

export default MuseumPiece;
