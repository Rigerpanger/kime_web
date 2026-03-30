import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CameraController = ({ targetPosition, isZoomed }) => {
    const { camera, controls } = useThree();
    const vec = new THREE.Vector3();
    const lookAtVec = new THREE.Vector3();

    useFrame((state, delta) => {
        const step = 0.05; // speed logic

        if (isZoomed && targetPosition) {
            // --- FLIGHT MODE --- 
            // When concentrating on a project, we take over control
            if (controls?.current) controls.current.enabled = false;

            // Calculate flight destination
            // Standard approach: Position along the normal vector from center
            const direction = new THREE.Vector3(...targetPosition).normalize();
            // Distance from center for close up
            const flightDistance = 16;
            const dest = direction.multiplyScalar(flightDistance);

            // Fly camera to destination
            state.camera.position.lerp(vec.copy(dest), step);

            // Turn focus to the target
            if (controls?.current) {
                controls.current.target.lerp(lookAtVec.set(targetPosition[0], targetPosition[1], targetPosition[2]), step);
                controls.current.update();
            }
        } else {
            // --- FREE ROAM ---
            // Let the user control the camera
            if (controls?.current && !controls.current.enabled) {
                controls.current.enabled = true;
            }

            // Optional: Gently recenter the "Pivot" to 0,0,0 if it drifted, 
            // so orbit is always around the globe center
            if (controls?.current) {
                controls.current.target.lerp(lookAtVec.set(0, 0, 0), step * 0.5);
                controls.current.update();
            }

            // DO NOT OVERRIDE camera.position here. Let OrbitControls handle it.
        }
    });

    return null;
};

export default CameraController;
