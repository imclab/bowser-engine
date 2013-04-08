// Library imports.
var THREE = require('three');

// Class imports.
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
    this.key = parameters.key ? parameters.key : this.id;
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

Scene.prototype.setGame = function(game) {
    game.scenes[this.key] = this;
    game.composer.add(this.pass);

    // Asking the children to set their game.
    for (var key in this.children) {
        if (this.children[key].setGame instanceof Function) {
            this.children[key].setGame(game);
        }
    }

    // Setting pointer to the game.
    this.game = game;
};

/**
 * Adds an object to the scene.
 * Also links it to the scene and trigger the load method.
 */
Scene.prototype.add = function(object) {

    // Declaring.
    var that = this;

    // Asking the object to set its scene.
    if (object.setScene instanceof Function) {
        object.setScene(this);
    }

    // Asking the object to set its game.
    if (object.setGame instanceof Function) {
        object.setGame(this.game);
    }

    // If the object has a load function we load it and add it on callback.
    if (object.load instanceof Function) {
        object.load(function() {
            THREE.Scene.prototype.add.call(that, object);
        });

    // We just add the object to the scene calling super.
    } else {
        THREE.Scene.prototype.add.call(this, object);
    }
};

/**
 * Updates the scene and it's children
 * @returns {undefined}
 */
Scene.prototype.update = function() {

    // Updates all children with an update method.
    for (var key in this.children) {
        if (this.children[key].update instanceof Function) {
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