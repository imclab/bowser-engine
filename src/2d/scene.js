// Imports.
var THREE = require('three');
var Scene = require('../scene');
var Entity2D = require('./entity');
var RenderPass = require('../pass/render');

/**
 * Initializes the scene.
 */
var Scene2D = function(parameters) {
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

Scene2D.prototype = Object.create(Scene.prototype);

/**
 * Sets the resolution of the scene.
 * @param {Number} width The width of the scene.
 * @param {Number} height The height of the scene.
 */
Scene2D.prototype.setResolution = function(width, height) {
    var key, scale;

    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();

    if (this.game.resolution.isValid() && this.game.resolution.adaptive) {
        scale = this.game.div.offsetWidth / this.game.resolution.width;
    } else {
        scale = 1.0;
    }

    for (key in this.children) {
        if (this.children[key] instanceof Entity2D) {
            var image = this.children[key].sprite.material.map.image;
            this.children[key].sprite.scale.set(image.width * scale, image.height * scale);
        }
    }
};

// Exports.
module.exports = Scene2D;