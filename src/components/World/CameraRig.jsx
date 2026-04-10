import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/useAppStore';
import useActiveSlug from '../../hooks/useActiveSlug';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const activeSlug = useActiveSlug();
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const isOverPanel = useAppStore(s => s.isOverPanel);
    const isOrbiting = useAppStore(s => s.isOrbiting);
    const setSectionView = useAppStore(s => s.setSectionView);
    const activeCameraId = useAppStore(s => s.activeCameraId);
 
    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();
    const lastSlug = useRef(activeSlug);
    const lastCamState = useRef({ azimuth: 0, polar: 0, radius: 0 });
    const settleTimer = useRef(0);
    const lastMoveTime = useRef(0);
    const isTransitioning = useRef(false);
    const isFirstRun = useRef(true);
 
    // Use a ref for reactive state within useFrame to avoid stale closure issues
    const stateRef = useRef({ activeSlug, config, showStudioEditor, isOverPanel });
    stateRef.current = { activeSlug, config, showStudioEditor, isOverPanel };

    const setDebug = useAppStore(s => s.setDebug);

    useFrame((state, delta) => {
        const { activeSlug: currentSlug, config: currentConfig, showStudioEditor: isEditing, isOverPanel: overPanel } = stateRef.current;

        // UPDATE TELEMETRY
        setDebug({ camera: [camera.position.x, camera.position.y, camera.position.z] });

        if (!currentConfig || !currentConfig.sections) return;

        // --- SECTION TRACKING ---
        if (lastSlug.current !== currentSlug) {
            lastSlug.current = currentSlug;
            isTransitioning.current = true;
        }

        // --- ORBIT OVERRIDE ---
        if (isEditing && isOrbiting) {
            isTransitioning.current = false;
            return; 
        }

// [ignoring loop detection]
        // Helper to ensure mathematical stability
        const safeNum = (val, fallback) => {
            const n = Number(val);
            return Number.isFinite(n) ? n : fallback;
        };

        const currentSection = currentConfig.sections?.[currentSlug] || currentConfig.sections?.default || {};
        let activeCam = currentSection.camera;

        if (activeCam) {
            const rawTheta = safeNum(activeCam.azimuth, 0) * (Math.PI / 180);
            const rawPhi = safeNum(activeCam.polar !== undefined ? activeCam.polar : 90, 90) * (Math.PI / 180);

            // -- RESPONSIVE FRAMING (FORCED PC/MOBILE CONSISTENCY) --
            const aspect = safeNum(state.size.width / Math.max(1, state.size.height), 1);
            let baseRadius = safeNum(activeCam.radius, 18);
            
            const targetLookArr = [
                safeNum(activeCam.pivotX, 0),
                safeNum(activeCam.pivotY, 5.1),
                safeNum(activeCam.pivotZ, 0)
            ];

            // Adjust framing for vertical aspect (Mobile / Portrait)
            if (aspect < 1.0) {
                // 1. Zoom Adjustment: Reduced from original 1.1 down to 0.69 (Approx 40% closer total)
                baseRadius = baseRadius * (0.69 / aspect); 
                
                // 2. Vertical Offset: Shift target down so model appears higher on screen
                // A value of 1.2 units is approx 10-15% of vertical view
                targetLookArr[1] -= 1.2;
            }
            
            const r = safeNum(baseRadius, 18);
            const theta = rawTheta;
            const phi = rawPhi;

            const targetPosArr = [
                targetLookArr[0] + r * Math.sin(phi) * Math.sin(theta),
                targetLookArr[1] + r * Math.cos(phi),
                targetLookArr[2] + r * Math.sin(phi) * Math.cos(theta)
            ];

            // Safety check for NaN in the final position array as well
            if (isNaN(targetPosArr[0]) || isNaN(targetPosArr[1]) || isNaN(targetPosArr[2])) {
                targetPosArr[0] = 0; targetPosArr[1] = 5.1; targetPosArr[2] = 18;
                targetLookArr[0] = 0; targetLookArr[1] = 5.1; targetLookArr[2] = 0;
            }

            // --- CINEMATIC SMOOTHING ---
            // Unify smoothing to prevent mobile "jumps" or speed changes during transitions
            const smoothing = 1.0; 
            const editorSmoothing = 4.0; 
            const s = isEditing ? editorSmoothing : smoothing;
            const d = Math.max(0.001, Math.min(0.2, delta || 0.016));

            // Apply movement (Independent axes for buttery glide)
            camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPosArr[0], s, d);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPosArr[1], s, d);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPosArr[2], s, d);

            if (controls) {
                controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookArr[0], s, d);
                controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookArr[1], s, d);
                controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookArr[2], s, d);
                // We keep controls.update() to sync camera matrix
                controls.update();
            } else {
                if (isFirstRun.current) {
                    vecTarget.set(...targetLookArr);
                    camera.position.set(...targetPosArr);
                    camera.lookAt(vecTarget);
                    isFirstRun.current = false;
                } else {
                    vecTarget.x = THREE.MathUtils.damp(vecTarget.x, targetLookArr[0], s, d);
                    vecTarget.y = THREE.MathUtils.damp(vecTarget.y, targetLookArr[1], s, d);
                    vecTarget.z = THREE.MathUtils.damp(vecTarget.z, targetLookArr[2], s, d);
                    camera.lookAt(vecTarget);
                }
            }

            // --- AUTO-CAPTURE LOGIC (AUTO-RESCUE) ---
            // Detect if the user is ORBITING and then STOPS.
            if (isEditing && isOrbiting) {
                const currentCamState = {
                    azimuth: controls.getAzimuthalAngle() * (180 / Math.PI),
                    polar: controls.getPolarAngle() * (180 / Math.PI),
                    radius: camera.position.distanceTo(controls.target)
                };

                const diff = Math.abs(currentCamState.azimuth - lastCamState.current.azimuth) +
                             Math.abs(currentCamState.polar - lastCamState.current.polar) +
                             Math.abs(currentCamState.radius - lastCamState.current.radius);

                if (diff > 0.05) {
                    lastCamState.current = currentCamState;
                    lastMoveTime.current = state.clock.elapsedTime;
                } else if (state.clock.elapsedTime - lastMoveTime.current > 1.0 && lastMoveTime.current !== 0) {
                    // Camera settled for 1 second - perform AUTO RESCUE
                    setSectionView(currentSlug, {
                        azimuth: currentCamState.azimuth,
                        polar: currentCamState.polar,
                        radius: currentCamState.radius,
                        pivotX: controls.target.x,
                        pivotY: controls.target.y,
                        pivotZ: controls.target.z
                    });
                    lastMoveTime.current = 0; // Reset timer until next move
                    console.log('AUTO-RESCUE COMPLETE for', currentSlug);
                }
            }

            return;
        }
    });

    return null;
};

export default CameraRig;
