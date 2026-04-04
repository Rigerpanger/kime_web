import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const view = useAppStore(s => s.view);
    const activeSlug = useAppStore(s => s.activeSlug);
    const config = useAppStore(s => s.sculptureConfig);

    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();

    // Listen to capture triggers
    const captureTrigger = useAppStore(s => s.captureTrigger);
    const updateSectionCamera = useAppStore(s => s.updateSectionCamera);
    useEffect(() => {
        if (captureTrigger > 0) {
            updateSectionCamera(activeSlug, {
                pos: camera.position.toArray(),
                target: controls?.target.toArray() || [0,0,0],
                zoom: camera.position.distanceTo(controls?.target || new THREE.Vector3(0,0,0))
            });
            console.log("Camera Captured for:", activeSlug);
        }
    }, [captureTrigger]);

    useFrame((state, delta) => {
        let currentSection = config.sections?.[activeSlug] || config.sections?.default;
        
        let targetPos = [0, 0, 16];
        let targetLook = [0, 0, 0];
        let lerpSpeed = 1.5;

        // Determine Section Context
        if (view === VIEWS.HOME) {
            targetPos = [0, 0, 18];
            targetLook = [0, 0, 0];
        } else if (view === VIEWS.SERVICES || view === VIEWS.SERVICE_DETAIL) {
            const cam = currentSection?.camera || { pos: [0, 0, 16], target: [0, 0, 0], zoom: 16, pivotY: 0 };
            
            // Calculate Vector from target to pos
            const dir = new THREE.Vector3().fromArray(cam.pos).sub(new THREE.Vector3().fromArray(cam.target)).normalize();
            
            // Re-calculate pos based on Zoom (Distance)
            const zoomDist = cam.zoom !== undefined ? cam.zoom : 16;
            const finalPos = new THREE.Vector3().fromArray(cam.target).add(dir.multiplyScalar(zoomDist));
            
            targetPos = finalPos.toArray();
            targetLook = [cam.target[0], cam.pivotY !== undefined ? cam.pivotY : cam.target[1], cam.target[2]];
            lerpSpeed = 2.0;
        } else {
            // General Fallback
            targetPos = [0, 0, 14];
            targetLook = [0, 0, 0];
        }

        // Apply Smoothing
        vecPos.set(...targetPos);
        camera.position.lerp(vecPos, delta * lerpSpeed);

        vecTarget.set(...targetLook);
        if (controls) {
            controls.target.lerp(vecTarget, delta * lerpSpeed);
            controls.update();
        } else {
            camera.lookAt(vecTarget);
        }
    });

    return null;
};

export default CameraRig;
