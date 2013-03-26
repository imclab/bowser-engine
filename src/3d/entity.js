// Imports.
var THREE = require('three');
var Entity = require('../entity');
var Collider = require('../collider');
var Sound = require('../sound');

/**
 * The entity object represent the idea of an idependant self-mangage object. For instance a character or a vehicle.
 * @returns {Entity3D}
 */
var Entity3D = function(parameters) {
    Entity.call(this, parameters);
};

Entity3D.prototype = Object.create(Entity.prototype);

/**
 * Augments Entity.add in order to handle the process in a 3D context.
 * @param THREE.Object3D object The object that will be added.
 */
Entity3D.prototype.add = function(object) {

    // Calling "super".
    Entity.prototype.add.call(this, object);

    // If there is no light in the scene the receive shadow causes a crash. Therefore we check for Scene3D since it has lights by default.
    if(object instanceof THREE.Mesh && !(object instanceof Collider) && !(object instanceof Sound)) {
        object.castShadow = true;
        object.receiveShadow = true;
    }
};

// Exports.
module.exports = Entity3D;
