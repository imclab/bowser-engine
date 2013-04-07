// Library imports.
var THREE = require('three');

/**
 * @constructor
 * @param {Game} game A game instance.
 */
var OrthographicCamera = function(parameters) {
    "use strict";

    // Initializing parameters.
    parameters = parameters ? parameters : {};

    // Calling super.
    THREE.OrthographicCamera.call(this, parameters.left, parameters.right, parameters.top, parameters.bottom, parameters.near, parameters.far);

    // Handling parameters.
    this.key = parameters.key ? parameters.key : this.id;
    this.position = parameters.position ? parameters.position : this.position;

    if (parameters.target) {
        this.lookAt(parameters.target);
    }
};

OrthographicCamera.prototype = Object.create(THREE.OrthographicCamera.prototype);

OrthographicCamera.prototype.add = function(object) {
    console.warn('Cannot add anything to camera ' + object.key + '. Skipping.');
};

OrthographicCamera.prototype.update = function() {};

// Exports.
module.exports = OrthographicCamera;