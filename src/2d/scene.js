// Imports.
var THREE = require('three');
var Scene = require('../scene');
var RenderPass = require('../pass/render');

/**
 * Initializes the scene.
 * @constructor
 * @returns {That} A That object.
 */
var That = function(parameters) {
    "use strict";
    Scene.call(this, parameters);

    // Initializing parameters.
    parameters = parameters ? parameters : {};
    this.camera = parameters.camera ? parameters.camera : new THREE.OrthographicCamera(0, 1, 1, 0, -50, 50);

    // Adding stuff to the scene.
    this.camera.updateProjectionMatrix();
    this.add(this.camera);

    // Creating the pass for that scene.
    this.pass = new RenderPass({
        scene: this,
        camera: this.camera
    });

    // Launching custom construction.
    this.onConstruction();
};

That.prototype = Object.create(Scene.prototype);

/**
 * Todos.
 * @param {[type]} width  [description]
 * @param {[type]} height [description]
 */
That.prototype.setResolution = function(width, height) {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();

    var scale;
    if (this.game.resolution.isValid() && this.game.resolution.adaptive) {
        scale = this.game.div.width() / this.game.resolution.width;
    } else {
        scale = 1;
    }

    for (var key in this.children) {
        if (this.children[key] instanceof THREE.Sprite) {
            this.children[key].scale.set(this.children[key].texture.image.width * scale, this.children[key].texture.image.height * scale, 1.0);
        }
    }
};

// Exports.
module.exports = That;