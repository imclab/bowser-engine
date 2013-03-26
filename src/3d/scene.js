// Imports.
var THREE = require('three');
var Scene = require('../scene');
var RenderPass = require('../pass/render');

/**
 * Initializes the scene object.
 * @constructor
 * @returns {Scene3} A scene object.
 */
var Scene3D = function(parameters) {
	"use strict";
	Scene.call(this, parameters);

	// Initializing parameters.
	parameters = parameters ? parameters : {};
	this.camera = parameters.camera ? parameters.camera : new THREE.PerspectiveCamera();

	// Adding lighting.
	this.light = new THREE.SpotLight(0xffffff, 1.75);
	this.light.position.set(120, 200, 120);
	this.light.castShadow = true;
	this.light.shadowDarkness = 0.5;
	this.light.shadowMapWidth = 2048;
	this.light.shadowMapHeight = 2048;
	this.light.shadowCameraNear = 100;
	this.light.shadowCameraFar = 500;
	this.light.shadowBias = -0.001;
	this.light.shadowCameraFov = 70;

	// Addding stuff to the scene.
	this.add(this.camera);
	this.add(this.light);

	// Creating a composer pass for that scene.
	this.pass = new RenderPass({
		scene: this,
		camera: this.camera
	});

	// Launching custom construction.
	this.onConstruction();
};

/**
 * Returns an extented version of Entity using prototypal inheritance.
 * This should be used for any custom entity creation.
 * @param {Object} extension An object containing what will be added to the extended entity prototype.
 */
Scene3D.extend = function(extensions) {
    var that = this;
    extensions = extensions instanceof Object ? extensions : {};

    function Class () {
        if (extensions.construct) {
            extensions.construct.apply(this, arguments);
        } else {
            that.apply(this, arguments);
        }
    }

    Class.prototype = Object.create(this.prototype);

    for (var key in extensions) {
        if (key !== 'construct') {
            Class.prototype[key] = extensions[key];
        }
    }

    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
};

Scene3D.prototype = Object.create(Scene.prototype);

/**
 * Sets the resolution of the scene by basically changing the camera aspect and updating it's projection matrix.
 * @param {Number} width
 * @param {Number} height
 */
Scene3D.prototype.setResolution = function(width, height) {
	this.camera.aspect = width / height;
	this.camera.updateProjectionMatrix();
};

// Exports.
module.exports = Scene3D;