"use strict";

import * as THREE from 'three' ;

/**
 * Calculate the average of a sample vectors over a defined delay. This is used to dampen
 * movement in the VR hands when pointing at a locations. 
 */
export class Vector3Damper {

    constructor(period) {
        this.period = period || 0.15;
        this._samples = [] ; 
        this._total = new THREE.Vector3() ;
        this._average = new THREE.Vector3() ;
    }

    /**
     * Add  a new sample to the damper and return the current damped vector. The time is 
     * used to determine the the sample period as samples may come into the damper at
     * different rates.
     * @param time the time the sample was taken in elapsed seconds.
     * @param sample 
     */
    add(time, sample) {   
        // Remove any old samples. Keeping a total and a count
        // means that the average can be determined on each step
        // instead of having to iterate over all the sample each time.
        const removeSamplesBefore = time - this.period ;
        while((this._samples.length) && (this._samples[0].time < removeSamplesBefore)) {
            const s = this._samples.shift() ; // we have checked the length
            this._total.x -= s.x ;
            this._total.y -= s.y ;
            this._total.z -= s.z ;
        }
        this._total.x += sample.x ;
        this._total.y += sample.y ;
        this._total.z += sample.z ;
        this._samples.push({time:time, x:sample.x, y:sample.y, z:sample.z})
        const count = this._samples.length ;
        // Recalculate the average 
        this._average.set(this._total.x / count,this._total.y / count,   this._total.z / count) ;
        return this._average;
    }

    /**
     * Return the average vector over the sample period. Do not modify this
     * return value, is it read only!
     */
    get average() {
        return this._average ;
    }

    clear() {
        this._samples = [] ;
        this._total.setScalar(0);
        this._average.setScalar(0);
    }

} 