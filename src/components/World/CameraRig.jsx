import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';
import servicesData from '../../data/services.json';

const CameraRig = () => {
    const { camera, controls } = useThree(); // requires <OrbitControls makeDefault />
    const view = useAppStore(s => s.view);
    const activeSlug = useAppStore(s => s.activeSlug);

    // Target Vectors
    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();

    useFrame((state, delta) => {
        // 1. Determine Desired State
        let targetPos = [0, 0, 16];
        let targetLook = [0, 0, 0];

        switch (view) {
            case VIEWS.HOME:
                targetPos = [0, 0, 16];
                targetLook = [0, 0, 0];
                break;

            case VIEWS.SERVICES:
                // Overview: Slightly wider, angled to see depth of explosion
                targetPos = [5, 2, 18];
                targetLook = [0, 0, 0];
                break;

            case VIEWS.SERVICE_DETAIL:
            case VIEWS.PROJECTS:
            case VIEWS.CONTACT:
            case VIEWS.ABOUT:
                let idx = -1;
                if (view === VIEWS.SERVICE_DETAIL && activeSlug) {
                    idx = servicesData.findIndex(s => s.slug === activeSlug);
                } else if (view === VIEWS.PROJECTS) {
                    idx = 1; // Projects -> AR/VR Shard
                } else if (view === VIEWS.CONTACT) {
                    idx = 3; // Contact -> Branding Shard
                } else if (view === VIEWS.ABOUT) {
                    idx = 4; // About -> AI Shard
                }

                if (idx !== -1) {
                    const total = servicesData.length;
                    const angle = (idx / total) * Math.PI * 2;
                    const radius = 2.0;
                    const gap = 0.8;
                    const r = radius + gap * 1.5;

                    const chunkX = Math.cos(angle) * r;
                    const chunkY = Math.sin(angle) * r;

                    // Camera Position: In front of the chunk, but offset to allow UI on side
                    // If UI is on RIGHT, Camera should be slightly LEFT of chunk?
                    // Let's just zoom straight in for now, we can offset later if needed.
                    const camDist = 6;
                    targetPos = [
                        Math.cos(angle) * (r + camDist),
                        Math.sin(angle) * (r + camDist),
                        4
                    ];
                    targetLook = [chunkX, chunkY, 0];
                } else {
                    targetPos = [0, 0, 14];
                }
                break;


        }

        // 2. Interpolate Camera Position
        vecPos.set(...targetPos);
        camera.position.lerp(vecPos, delta * 1.5); // Smooth ease

        // 3. Interpolate LookAt (Controls Target)
        if (controls) {
            vecTarget.set(...targetLook);
            controls.target.lerp(vecTarget, delta * 1.5);
            controls.update();
        } else {
            // Fallback if no controls
            camera.lookAt(vecTarget.set(...targetLook));
        }
    });

    return null; // Rig is logic only
};

export default CameraRig;
