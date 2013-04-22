// Library imports.
var THREE = require('three');

// Class imports.
var Scene = require('../scene');
var Entity2D = require('./entity');
var RenderPass = require('../pass/render');
var OrthographicCamera = require('../camera/orthographic');

/**
 * Initializes the scene.
 */
var Scene2D = function(parameters) {
    "use strict";
    Scene.call(this, parameters);

    // Initializing parameters.
    parameters = parameters ? parameters : {};
    this.camera = parameters.camera ? parameters.camera : new OrthographicCamera({
        left: 0,
        right: 1,
        top: 1,
        bottom: 0,
        near: -50,
        far: 50
    });

    // Adding stuff to the scene.
    this.camera.updateProjectionMatrix();
    this.add(this.camera);

    // Initializing upscale.
    this.upscale = 1.0;

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
        this.upscale = this.game.div.offsetWidth / this.game.resolution.width;
    } else {
        this.upscale = 1.0;
    }

    for (key in this.children) {
        if (this.children[key].setResolution) {
            this.children[key].setResolution();
        }
    }
};

// Exports.
module.exports = Scene2D;