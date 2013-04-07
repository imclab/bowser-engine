// Library imports.
var THREE = require('three');

/**
 * @constructor
 * @param {Game} game A game instance.
 */
var PerspectiveCamera = function(parameters) {
    "use strict";

    // Initializing parameters.
    parameters = parameters ? parameters : {};

    THREE.PerspectiveCamera.call(this, parameters.fov, parameters.aspect, parameters.near, parameters.far);

    // Handling parameters.
    parameters = parameters ? parameters : {};
    this.key = parameters.key ? parameters.key : this.id;
    this.position = parameters.position ? parameters.position : this.position;

    if (parameters.lens) {
        this.setLens(parameters.lens);
    }

    if (parameters.target) {
        this.lookAt(parameters.target);
    }
};

PerspectiveCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);

PerspectiveCamera.prototype.add = function(object) {
    console.warn('Cannot add anything to camera ' + object.key + '. Skipping.');
};

PerspectiveCamera.prototype.update = function() {};

// Exports.
module.exports = PerspectiveCamera;