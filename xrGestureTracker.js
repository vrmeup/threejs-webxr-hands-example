"use strict";

import * as THREE from "three";

export const HandJointNames = [
    'wrist',
    'thumb-metacarpal',
    'thumb-phalanx-proximal',
    'thumb-phalanx-distal',
    'thumb-tip',
    'index-finger-metacarpal',
    'index-finger-phalanx-proximal',
    'index-finger-phalanx-intermediate',
    'index-finger-phalanx-distal',
    'index-finger-tip',
    'middle-finger-metacarpal',
    'middle-finger-phalanx-proximal',
    'middle-finger-phalanx-intermediate',
    'middle-finger-phalanx-distal',
    'middle-finger-tip',
    'ring-finger-metacarpal',
    'ring-finger-phalanx-proximal',
    'ring-finger-phalanx-intermediate',
    'ring-finger-phalanx-distal',
    'ring-finger-tip',
    'pinky-finger-metacarpal',
    'pinky-finger-phalanx-proximal',
    'pinky-finger-phalanx-intermediate',
    'pinky-finger-phalanx-distal',
    'pinky-finger-tip'
]

export class Finger {
    constructor() {
        this.pointing = false ;
        this.base = new THREE.Vector3() ;
        this.direction = new THREE.Vector3()
        this.tip = new THREE.Vector3()    
    }
}

const palmDebugColor  = {
    'up' : new THREE.Color('blue'),
    'inside' : new THREE.Color('green'),
    'outside' : new THREE.Color('black'),
    'down' : new THREE.Color('red'),
    'forward' : new THREE.Color('yellow'),
    'backward' : new THREE.Color('magenta'),
}

const __baseVector = new THREE.Vector3;
const __tipVector = new THREE.Vector3;
const __start = new THREE.Vector3;
const __end = new THREE.Vector3;
const __p0 = new THREE.Vector3;
const __p1 = new THREE.Vector3;
const __p2 = new THREE.Vector3;
const __p3 = new THREE.Vector3;
const __wristWQuat = new THREE.Quaternion;
const __headQuat = new THREE.Quaternion;

/**
 * The Gesture tracker monitors the position of the fingers to determine
 * if they are pointing, orientation of the hand, and location of the index
 * and thumb. Combinations of this information can be used to create
 * "gestures" in the application.
 */
export class XrGestureTracker {

    finger = {
        'thumb' : new Finger(),
        'index' : new Finger(),
        'middle' : new Finger(),
        'ring' : new Finger(),
        'pinky' : new Finger(),
    };

    constructor(context, hand, handSide, head) {  
        this.context = context ;
        this.hand = hand ;
        this.head = head ;
        this.handSide = handSide ;

        this.thumbIndexAngle = 0.0 ; 
        this.palmFacing = "up" ; // 'up' | 'inside' | 'outside' | 'down' | 'forward' | 'backward' ;
        this.thumpIndexDistance = 0.0 ;

        this._thumbTipBall = this.addBallToFingerEnd('thumb-tip') ;
        this._indexTipBall = this.addBallToFingerEnd('index-finger-tip') ;
        this._middleTipBall = this.addBallToFingerEnd('middle-finger-tip') ;
        this._ringTipBall = this.addBallToFingerEnd('ring-finger-tip') ;
        this._pinkyTipBall = this.addBallToFingerEnd('pinky-finger-tip') ;
        this._wristBall = this.addBallToFingerEnd('wrist', 0.03) ;
        this._debugAxis = [];
        for(let name of HandJointNames) {
            const joint = this.hand.joints[name];
            if(joint) {
                const axis = new THREE.AxesHelper(0.015) ;
                this._debugAxis.push(axis)
                joint.add(axis);
            }
        }
    }

    update() { 
        const thumb = this.updateThumb('thumb') ;     
        const index = this.updateFinger('index') ;     
        this.updateFinger('middle') ;     
        this.updateFinger('ring') ;     
        this.updateFinger('pinky') ;   
        
        // Determine the angle between the thumb around the Proximal Phalanx and the index finger Proximal Phalanx
        __baseVector.copy(index.base).sub(thumb.base).normalize()
        const cos = thumb.direction.dot(__baseVector) ; 
        // map dot product angle (1 = 0Deg -> -1 = 180Deg) to radians (0 -> PI)
        this.thumbIndexAngle = Math.acos(cos) ; // 0 -> PI

        // Determine the direction the palm is facing relative to the players head
        this.hand.joints[`wrist`]?.getWorldQuaternion(__wristWQuat);
        __baseVector.set(0, -1, 0) ; // Ray out from Palm
        __baseVector.applyQuaternion(__wristWQuat);
        var palmDotUpRad = Math.acos(this.head.up.dot(__baseVector)) ;
        var palmDotForwardRad = Math.acos(this.head.forward.dot(__baseVector)) ;
        var palmDotRightRad = Math.acos(this.head.right.dot(__baseVector)) ;

        if(palmDotForwardRad < Math.PI / 4.0) {
            this.palmFacing = 'forward' ;
        } else if(palmDotForwardRad > Math.PI / 4.0 * 3.0) {
            this.palmFacing = 'backward' ;
        } else {
            if(palmDotUpRad > Math.PI / 4.0 * 3.0) {
                this.palmFacing = 'down'
            } else if(palmDotUpRad < Math.PI / 4.0) {
                this.palmFacing = 'up'
            } else {
                if(this.handSide == 'right') {
                    this.palmFacing = (palmDotRightRad < Math.PI / 2.0) ? 'outside' : 'inside';
                } else {
                    this.palmFacing = (palmDotRightRad < Math.PI / 2.0) ? 'inside' : 'outside';
                }
            }
        }

        this.thumpIndexDistance = thumb.tip.distanceTo(index.tip);

        this.updateDebug();
    }

    updateDebug() {
        this._thumbTipBall.material.color.setColorName(this.finger["thumb"].pointing ? "green" : "red") ;
        this._indexTipBall.material.color.setColorName(this.finger["index"].pointing ? "green" : "red") ;
        this._middleTipBall.material.color.setColorName(this.finger["middle"].pointing ? "green" : "red") ;
        this._ringTipBall.material.color.setColorName(this.finger["ring"].pointing ? "green" : "red") ;
        this._pinkyTipBall.material.color.setColorName(this.finger["pinky"].pointing ? "green" : "red") ;
        this._wristBall.material.color.copy(palmDebugColor[this.palmFacing]) ;
    }

    updateThumb(fingerName) {
        // See https://www.w3.org/TR/webxr-hand-input-1/ for details
        const finger = this.finger[fingerName] ;
        const metacarpal = this.hand.joints[`thumb-metacarpal`] ;
        const phalanxProximal = this.hand.joints[`thumb-phalanx-proximal`] ;
        const phalanxDistal = this.hand.joints[`thumb-phalanx-distal`] ;
        const tip = this.hand.joints[`thumb-tip`] ;

        metacarpal?.getWorldPosition(__p0) ;
        phalanxProximal?.getWorldPosition(__p1) ;
        phalanxDistal?.getWorldPosition(__p2) ;
        tip?.getWorldPosition(__p3) ;
        
        this.setFingerFromPoints(finger, fingerName);
        return finger ;
    }

    updateFinger(fingerName) {
        // See https://www.w3.org/TR/webxr-hand-input-1/ for details
        const finger = this.finger[fingerName] ;
        const phalanxProximal = this.hand.joints[`${fingerName}-finger-phalanx-proximal`] ;
        const phalanxIntermediate = this.hand.joints[`${fingerName}-finger-phalanx-intermediate`] ;
        const phalanxDistal = this.hand.joints[`${fingerName}-finger-phalanx-distal`] ;
        const tip = this.hand.joints[`${fingerName}-finger-tip`] ;

        phalanxProximal?.getWorldPosition(__p0) ;
        phalanxIntermediate?.getWorldPosition(__p1) ;
        phalanxDistal?.getWorldPosition(__p2) ;
        tip?.getWorldPosition(__p3) ;

        this.setFingerFromPoints(finger, fingerName);
        return finger ;
    }

    addBallToFingerEnd(tipName, size = 0.01) {
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 4), 
            new THREE.MeshPhongMaterial({ color: "white" }));  
        const tip = this.hand.joints[tipName] ;
        tip?.add(ball) ;
        return ball ;
    }

    setFingerFromPoints(finger, fingerName) {
        __baseVector.copy(__p1).sub(__p0).normalize();
        __tipVector.copy(__p3).sub(__p2).normalize();
        const dot = __baseVector.dot(__tipVector);

        finger.pointing = (dot > 0.85); // The base and the tip of the finger are pointing in basically the same direction
        finger.base.copy(__p0);
        finger.direction.copy(__p3).sub(__p0).normalize();
        finger.tip.copy(__p3);
    }

    getVectorFrom(start, end, direction) {
        start?.getWorldPosition(__start.setScalar(0)) ;
        end?.getWorldPosition(__end.setScalar(0)) ;
        direction.copy(__end).sub(__start).normalize();
        return direction
    }
}
