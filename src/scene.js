// Imports.
var THREE = require('three');
var Collider = require('./collider');

/**
 * @constructor
 * @param {Game} game A game instance.
 */
var Scene = function(parameters) {
    "use strict";
    THREE.Scene.call(this);

    // Initializing parameters.
    parameters = parameters ? parameters : {};
    this.key = parameters.key;
    this.entities = {};
    this.sounds = {};
    this.colliders = [];
    this.onUpdate = parameters.onUpdate ? parameters.onUpdate : function() {};
    this.onConstruction = parameters.onConstruction ? parameters.onConstruction : function() {};
    this.gravity = parameters.gravity ? parameters.gravity : new THREE.Vector3();
    this.drag = parameters.drag !== undefined ? parameters.drag : 1.0;

    // Add entitites if any provided.
    var entities = parameters.entities ? parameters.entities : [];
    for (var key in entities) {
        this.add(entities[key]);
    }
};

Scene.prototype = Object.create(THREE.Scene.prototype);

/**
 * Allows to add entities to the scene.
 */
Scene.prototype.add = function(object) {

    // Linking the scene to the object.
    object.scene = this;

    // Initialize the object.
    if (object.init instanceof Function) {
        object.init();
    }

    THREE.Scene.prototype.add.call(this, object);
};

/**
 * Updates the scene and it's children
 * @returns {undefined}
 */
Scene.prototype.update = function() {

    // Updates all children with an update method.
    for(var key in this.children) {
        if(this.children[key].update instanceof Function) {
            this.children[key].update();
        }
    }

    // Launching custom update.
    this.onUpdate();
};

/**
 * Shows the active colliders.
 */
Scene.prototype.showColliders = function() {
    for (var key in this.colliders) {
        if (this.colliders[key] instanceof Collider) {
            this.colliders[key].visible = true;
        }
    }
};

/**
 * Hides all colliders.
 */
Scene.prototype.hideColliders = function() {
    for (var key in this.colliders) {
        if (this.colliders[key] instanceof Collider) {
            this.colliders[key].visible = false;
        }
    }
};

// Exports.
module.exports = Scene;



