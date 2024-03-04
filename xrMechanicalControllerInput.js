"use strict";

import * as THREE from 'three';

// Working variables, prevents "new" allocations
const __rot = new THREE.Quaternion();
const __wristOffset = new THREE.Vector3();
const __euler = new THREE.Euler();
const __wristQuat = new THREE.Quaternion();

/**
 * Manages the standard WebXR mechanical "grip" controller.
 */
export class XrMechanicalControllerInput {
    constructor(context, grip, gamePad, handSide) {
        this.context = context ;
        this._grip = grip ;
        this._gamePad = gamePad ;
        this._handSide = handSide ;
        this._wristAxis = new THREE.AxesHelper(0.1)

        this.select = false ;
        this.squeeze = false ;
        
        this.touchPad = new THREE.Vector2();
        this.touchPadButton = false;
        this.thumbStick = new THREE.Vector2();
        this.thumbStickButton = false;
        this.buttonA = false;
        this.buttonB = false;
        this.hasHand = false ;

        this._localPosition = new THREE.Vector3();
        this._localRotation = new THREE.Quaternion();
        this._worldPosition = new THREE.Vector3();
        this._worldRotation = new THREE.Quaternion();
        this.pointerActive = true ;
        this._pointerWOrigin = new THREE.Vector3();
        this._pointerWDirection = new THREE.Vector3();
        this._lastUpdate = -1;
    }

    /*
     * Position of the head tracker relative to the parent object.
     */
    get wristLPos() {
        this.refresh();
        return this._localPosition;
    }

    /*
     * Rotation of the head tracker relative to the parent object.
     */
    get wristLQuat() {
        this.refresh();
        return this._localRotation;
    }

    /*
     * position of head in world coordinates
     */
    get wristWPos() {
        this.refresh();
        return this._worldPosition;
    }

    /*
     * rotation of head in world orientation
     */
    get wristWQuat() {
        this.refresh();
        return this._worldRotation;
    }

    /*
     *  The position of the pointer that matches the controller
     */
    get pointerWOrigin() {
        this.refresh();
        return this._pointerWOrigin;
    }

    /*
     *  The direction of the pointer that matches the controller
     */
    get pointerWDirection() {
        this.refresh();
        return this._pointerWDirection;
    }   

    /*
     * Apply haptic feedback to the controller (vibrate)
     */
    vibrate(intensity, timeMs) {
        if (this._gamePad.hapticActuators && this._gamePad.hapticActuators.length >= 1) {
            this._gamePad.hapticActuators[0].pulse(intensity || 1, timeMs || 100);
        }
    }

    /**
     * Called when the controller is connected
     */
    onConnect() {       
        this.context.scene.add(this._wristAxis); 
    }

    /**
     * Called on each animation frame
     */
    onAnimate() {  
        this._wristAxis.position.copy(this.wristWPos) ;   
        this._wristAxis.quaternion.copy(this.wristWQuat) ;   
    }

    /**
     * Called when the controller is disconnected
     */
    onDisconnect() {
        this._wristAxis?.removeFromParent(); 
    }

    /*
     * In order to keep the reference points like the wrist location and the 
     * pointer location abstracted from input (hand or controller) map
     * the wrist position and rotation to a [[[]]] and position the pointer
     * at the point in the controller that makes sense for the controller. 
     */
    refresh() {
        if (this._lastUpdate == this.context.frame)
            return; // already updated for this frame
        this._lastUpdate = this.context.frame;

        // Position, and determine local (to the parent) position
        this._grip.getWorldPosition(this._worldPosition);
        this._grip.getWorldQuaternion(this._worldRotation);

        // Offset the world position to find the wrist location
        const offset = (this._handSide == 'left') ? 
            { x : -0.02, y: 0.0, z: 0.09 } : // Left Wrist offset
            { x : 0.02, y: 0.0, z: 0.09 } ; // Right Wrist offset
        __wristOffset.set(offset.x, offset.y, offset.z) ;
        __wristOffset.applyQuaternion(this._worldRotation) ;
        this._worldPosition.add(__wristOffset);


        // Convert world position and rotation to relative to the parent object
        this._localPosition.copy(this._worldPosition);
        this._localPosition.sub(this._grip.parent.position);
        __rot.copy(this._grip.parent.quaternion).invert();
        this._localPosition.applyQuaternion(__rot);

        // Rotate the hand so that the fingers are forward, thumb up position
        if(this._handSide == 'left') {
            __wristQuat.setFromEuler(__euler.set(0.0, Math.PI/8.0 * 1.5, Math.PI/2.0, "ZYX"))
        } else {
            __wristQuat.setFromEuler(__euler.set(0.0, -Math.PI/8.0 * 1.5, -Math.PI/2.0, "ZYX"))
        }
        this._worldRotation.multiply(__wristQuat);

        // Rotation, and determine local (to the parent) rotation
        this._localRotation.copy(this._grip.parent.quaternion);
        this._localRotation.invert();
        this._localRotation.multiply(this._worldRotation);

        // Pointer 
        this._grip.getWorldPosition(this._pointerWOrigin.setScalar(0));
        this._pointerWDirection.set(0,-1,-1).normalize() ; // Forward
        this._grip.getWorldQuaternion(__rot);
        this._pointerWDirection.applyQuaternion(__rot);

        // update gamepad
        // https://www.w3.org/TR/webxr-gamepads-module-1/
        if (this._gamePad) {
            let axis = this._gamePad.axes;
            if (axis && axis.length > 3) {
                // Mixed Reality
                this.touchPad.set(axis[0], axis[1]);
                // Mixed Reality and Quest 2
                this.thumbStick.set(axis[2], axis[3]);
            }
            let buttons = this._gamePad.buttons;
            if (buttons) {
                // Mixed Reality and Quest 2
                this.touchPadButton = (buttons.length > 2) ? buttons[2].pressed : false;
                this.thumbStickButton = (buttons.length > 3) ? buttons[3].pressed : false;
                // Quest 2
                this.buttonA = (buttons.length > 4) ? buttons[4].pressed : false;
                this.buttonB = (buttons.length > 5) ? buttons[5].pressed : false;
            }
        }
    }
}
