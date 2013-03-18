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