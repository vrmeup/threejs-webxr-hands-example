"use strict";

import * as THREE from 'three';

/**
 * Track the location of the players head using the camera, so that the
 * correct orientation of the hand can be determined. 
 */
export class XrHead {
    constructor(context) {
        this.context = context;
        this.position = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.worldUp = new THREE.Vector3();
        this.forward = new THREE.Vector3();
        this.up = new THREE.Vector3();
        this.right = new THREE.Vector3();

        this.headModel = new THREE.Group();
        this.context.scene.add(this.headModel);
        this.headModel.add(new THREE.AxesHelper(0.2));
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshPhongMaterial({ color: 'magenta' }));
        head.scale.set(1, 1.25, 1);
        this.headModel.add(head);
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshPhongMaterial({ color: 'white' }));
        nose.position.set(0, 0, -0.1);
        this.headModel.add(nose);
    }

    /**
     * Determine the world coordinates and axis of the players head
     */
    update() {
        this.context.camera.getWorldPosition(this.position);
        this.context.camera.getWorldQuaternion(this.quaternion);
        this.worldUp.set(0, 1, 0);
        this.up.set(0, 1, 0).applyQuaternion(this.quaternion);
        this.forward.set(0, 0, -1).applyQuaternion(this.quaternion);
        this.right.set(1, 0, 0).applyQuaternion(this.quaternion);

        this.headModel.position.copy(this.position);
        this.headModel.quaternion.copy(this.quaternion);
    }
}
