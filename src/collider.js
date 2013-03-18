// Imports.
var THREE = require('three');

/**
 * The collider object is responsible for managing collision detection. It inherits from THREE.Mesh.
 * @constructor
 * @param {THREE.Geometry} geometry Shape the collider will take.
 * @param {Boolean} offensive Dealing damage or not.
 * @param {Boolean} emit Emits collisions for other colliders.
 * @param {Boolean} receive Receives collisions from other colliders.
 * @param {Boolean} visible Rendered or not.
 * @param {Boolean} zone Other colliders can "walkthrough" this collider.
 */
var Collider = function(parameters) {
    "use strict";

    // Processing complementary arguments.
    if(!(parameters.geometry instanceof THREE.Geometry)) {
        throw 'Please provide a THREE.Geometry to initialize a collider.';
    }

    // Processing optional arguments.
    parameters = parameters instanceof Object ? parameters : {};
    this.key = parameters.key;
    this.offensive = parameters.offensive !== undefined ? parameters.offensive : false;
    this.emit = parameters.emit !== undefined ? parameters.emit : true;
    this.entity = undefined;
    this.scene = undefined;
    this.position = parameters.position ? parameters.position : this.position;
    this.receive = parameters.receive !== undefined ? parameters.receive : false;
    var color = this.offensive ? 0xfa1e50 : 0x00e6fa;
    var material = parameters.material instanceof THREE.Material ? material : new THREE.MeshBasicMaterial({
        wireframe: true,
        color: color,
        wireframeLinewidth: 1,
        wireframeLinejoin: 'miter'
    });

    // Initializing the parent object.
    THREE.Mesh.call(this, parameters.geometry, material);

    // Finishing to process optional arguments.
    this.collisions = [];
    this.visible = parameters.visible !== undefined ? parameters.visible : false;
    this.zone = parameters.zone !== undefined ? parameters.zone : false;
};

Collider.prototype = Object.create(THREE.Mesh.prototype);

Collider.prototype.add = function(object) {
    console.warn('Cannot add anything to collider ' + object.key + '. Skipping.');
};

Collider.prototype.init = function() {

    // Registerin in the entity.
    if(this.entity) {
        this.entity.colliders[this.key] = this;
    }

    // Registering in the scene.
    if(this.scene) {
        if (this.emit) {
            this.scene.colliders.push(this);
        }
    }
};

/**
 * Updates the collider object.
 */
Collider.prototype.update = function() {
    if(this.receive) {
        this.getCollisions();
    }
};

/**
 * Gets the detected collisions.
 */
Collider.prototype.getCollisions = function() {
    return [];
};

// Exports.
module.exports = Collider;
