"use strict";

import * as THREE from 'three';
import { Vector3Damper } from './vectorDamper.js';
import { XrGestureTracker } from './xrGestureTracker.js';

const DamperTimeS = 0.15 ;

// Working variables, prevents "new" allocations
const __rot = new THREE.Quaternion();
const __shoulderWPos = new THREE.Vector3();
const __originWPos = new THREE.Vector3();
const __originWDir = new THREE.Vector3();
const __offset = new THREE.Vector3();

/**
 * Manages the players physical hand input.
 */
export class XrHandControllerInput{

    constructor( context, hand,  gamePad, handSide, head) {
        this.gesture = new XrGestureTracker(context, hand, handSide, head);
        this.context = context ;
        this.hand = hand ;
        this.head = head ;
        this.gamePad = gamePad ;
        this.handSide = handSide ;
        this.hasHand = true ;
        
        this.select = false;
        this.squeeze = false;

        this._localPosition = new THREE.Vector3();
        this._localRotation = new THREE.Quaternion();
        this._worldPosition = new THREE.Vector3();
        this._worldRotation = new THREE.Quaternion();
        this._pointerOrigin = new THREE.Vector3();
        this._pointerDirection = new THREE.Vector3();
        this.pointerActive = false ;
        this._pointerOriginDamper = new Vector3Damper(DamperTimeS) ;
        this._pointerDirectionDamper = new Vector3Damper(DamperTimeS) ;
        this._lastUpdate = -1;
        this._wristAxis = new THREE.AxesHelper(0.1)
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

    get pointerWOrigin() {
        this.refresh();
        return this._pointerOrigin;
    }

    get pointerWDirection() {
        this.refresh();
        return this._pointerDirection;
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
     * There are no events generated when a controller is moved (currently) so
     * we have to query the location of the controller THREE object in order
     * to determine its location and rotation.
     */
    refresh() {
        if (this._lastUpdate == this.context.frame)
            return; // already updated for this frame
        this._lastUpdate = this.context.frame;

        const wrist = this.hand.joints["wrist"];
        if (!wrist)
            return;

        const parent = this.context.scene;
        // Position, and determine local (to the parent) position
        wrist.getWorldPosition(this._worldPosition);
        // Convert world postion and rotation to relative to the parent object
        this._localPosition.copy(this._worldPosition);
        this._localPosition.sub(parent.position);
        __rot.copy(parent.quaternion).invert();
        this._localPosition.applyQuaternion(__rot);

        // Rotation, and determine local (to the parent) rotation
        wrist.getWorldQuaternion(this._worldRotation);
        this._localRotation.copy(parent.quaternion);
        this._localRotation.invert();
        this._localRotation.multiply(this._worldRotation);

        this.gesture.update();
        // Use the index finger as the default pointer
        // this._pointerOrigin.copy(this.gesture.finger['index'].base);
        // this._pointerDirection.copy(this.gesture.finger['index'].direction);

        // The pointer is between the shoulder and a point between the tip of
        // the thump and the tip of the index finger. It makes the pointer feel
        // more like a mouse and the hand tracker automatically detects the "pinch"
        // action 
        const height = this.head.position.length();
        const offset = height / 8.0 ;
        // Calculate the sholder location => __vec3
        __shoulderWPos.copy(this.head.position) ;
        __offset.copy(this.head.up).normalize().multiplyScalar(-offset);
        __shoulderWPos.add(__offset) ; // Base of neck
        const shoulderOffset = (this.handSide == 'right') ? offset : -offset ;
        __offset.copy(this.head.right).normalize().multiplyScalar(shoulderOffset);
        __shoulderWPos.add(__offset) ; // shoulder
        
        // Midpoint of thumb and index fingers
        const indexFinger = this.gesture.finger["index"];
        const thumb = this.gesture.finger["thumb"];
        if(indexFinger && thumb) {
            __originWPos.copy(indexFinger.tip).add(thumb.tip).divideScalar(2.0);
        } else {
            __originWPos.copy(this._worldPosition);
        }
        // Use damped values so that a pinch action does not immediately effect the pointer
        this._pointerOrigin.copy(this._pointerOriginDamper.add(this.context.elapsedTime, __originWPos)) ;

        // Damp the direction as well
        __originWDir.copy(this._pointerOrigin).sub(__shoulderWPos).normalize();
        this._pointerDirection.copy(this._pointerDirectionDamper.add(this.context.elapsedTime, __originWDir)) ;

        this.pointerActive = this.gesture.thumpIndexDistance < 0.05 && this.gesture.palmFacing == 'forward' ;
    }
}
