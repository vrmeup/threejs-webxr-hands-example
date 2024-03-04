"use strict";

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XrMechanicalControllerInput } from './xrMechanicalControllerInput.js' ;
import { XrHandControllerInput } from './xrHandControllerInput.js' ;
import { XrHead } from './xrHead.js' ;
import { Pointer } from './pointer.js';

const PointerActiveColor = new THREE.Color("gray") ;
const PointerPressedColor = new THREE.Color("yellow") ;

/**
 * Create the WebXR grip controllers and hand controllers and respond
 * to the event to manage the corresponding handler classes.
 */
export class XrInput {

    constructor(context)
    {
        this.context = context ;
        this._controllerModelFactory = new XRControllerModelFactory();
        this._handModelFactory = new XRHandModelFactory();
        this._leftHandController = undefined ;
        this._rightHandController = undefined ;
        this._head = new XrHead(this.context) ;
        
        const xr = context.renderer.xr 
        const profile = 'mesh' // 'spheres' | 'boxes' | 'mesh'
        this.setupController(0, xr, profile);
        this.setupController(1, xr, profile);

        this._leftPointer = new Pointer() ;
        this.context.scene.add(this._leftPointer) ;
        this._rightPointer = new Pointer() ;
        this.context.scene.add(this._rightPointer) ;
    }

    onAnimate() { 
        this._head.update();
        this._leftHandController?.onAnimate();       
        this._rightHandController?.onAnimate();   
        
        this.updateDebugPointers(this._leftPointer, this._leftHandController);
        this.updateDebugPointers(this._rightPointer, this._rightHandController);
    }

    updateDebugPointers(pointer, controller) {
        if (!controller || !controller.pointerActive) {
            pointer.visible = false ;
            return ;
        }
        
        pointer.visible = true ;
        if(controller.select) {
            pointer.material.color = PointerPressedColor ;
        } else {
            pointer.material.color = PointerActiveColor ;
        }
        pointer.setFromDir(controller.pointerWOrigin, controller.pointerWDirection);
    }

    setupController(index, xr, handProfile) {
        // Controller
        const controllerGrip = xr.getControllerGrip(index);
        const controllerModel = this._controllerModelFactory.createControllerModel(controllerGrip);
        controllerGrip.add(controllerModel);
        const axis = new THREE.AxesHelper(0.2)
        controllerModel.add(axis);
        this.context.scene.add(controllerGrip);

        // Hand
        const controllerHand = xr.getHand(index);
        const handModel = this._handModelFactory.createHandModel(controllerHand, handProfile) ;
        controllerHand.add(handModel);
        this.context.scene.add(controllerHand);
        
        // Events
        controllerGrip.addEventListener('connected', (event) => this.onControllerConnect(event, controllerGrip, controllerHand));
        controllerGrip.addEventListener('disconnected', (event) => this.onControllerDisconnect(event, controllerGrip, controllerHand));
    }

    onControllerConnect(event, controllerGrip, hand){
        const data = event.data ;
        this.logData(data) ;
        let gamepad = event.data.gamepad ;
        if (data.handedness == "right") {
            if(data.hand) {
                this._rightHandController = new XrHandControllerInput(this.context, hand, gamepad, 'right', this._head);
            } else {
                this._rightHandController = new XrMechanicalControllerInput(this.context, controllerGrip, gamepad, 'right');
            }
            this.addEvents(controllerGrip, this._rightHandController);
            this._rightHandController.onConnect();
        }
        if (data.handedness == "left") {
            if(data.hand) {
                this._leftHandController = new XrHandControllerInput(this.context, hand, gamepad, 'left', this._head);
            } else {
                this._leftHandController = new XrMechanicalControllerInput(this.context, controllerGrip, gamepad, 'left');
            }
            this.addEvents(controllerGrip, this._leftHandController);
            this._leftHandController.onConnect();
        }
    }

    onControllerDisconnect(event, controllerGrip, hand) {
        const data = event.data ;
        this.logData(data) ;
        if (data.handedness == "right") {
            this._rightHandController?.onDisconnect();
            this._rightHandController = undefined ;
        }
        if (data.handedness == "left") {
            this._leftHandController?.onDisconnect();
            this._leftHandController = undefined;
        }
    }

    logData(data) {
        console.info(`Controller ${data.handedness} connected gamepad${data.gamepad?"✔":"❌"} grip${data.gripSpace?"✔":"❌"} hand${data.hand?"✔":"❌"}`)
    }
    
    addEvents(controller, hand)
    {
        controller.addEventListener('selectstart', () => {
            hand.select = true;
        });
        controller.addEventListener('selectend', () => {
            hand.select = false;
        });

        controller.addEventListener('squeezestart', () => {
            hand.squeeze = true;
        });
        controller.addEventListener('squeezeend', () => {
            hand.squeeze = false;
        });
    }
}