// Imports.
var THREE = require('three');
var Composer = require('../composer');

/**
 * @author alteredq	
 */
var ShaderPass = function(parameters) {

	// Handling parameters.
	parameters = parameters !== undefined ? parameters : {};
	this.composer = parameters.composer !== undefined ? parameters.composer : this.composer;
	this.textureID = parameters.textureID !== undefined ? parameters.textureID : "texture";
	this.shader = parameters.shader;

	if (this.shader instanceof THREE.ShaderMaterial) {
		this.material = this.shader;

	} else {
		this.material = new THREE.ShaderMaterial({
			uniforms: this.shader.uniforms,
			vertexShader: this.shader.vertexShader,
			fragmentShader: this.shader.fragmentShader

		});
	}

	this.buffer = {};
	this.buffer.textureSize = new THREE.Vector2();

	this.renderToScreen = false;
	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;
};

ShaderPass.prototype.render = function() {
	var renderer = this.composer.game.renderer;
	var writeBuffer = this.composer.writeBuffer;
	var readBuffer = this.composer.readBuffer;
	var camera = this.composer.camera;
	var scene = this.composer.scene;
	var delta = this.composer.game.delta;

	if (this.material.uniforms[this.textureID]) {
		this.material.uniforms[this.textureID].value = readBuffer;
	}

	// This is hacky but I don't have a better solution for now.
	if (this.material.uniforms.textureSize) {
		if (!this.material.uniforms.textureSize.value) {
			if (this.composer.game.resolution.isValid()) {
				this.material.uniforms.textureSize.value = new THREE.Vector2(this.composer.game.resolution.width, this.composer.game.resolution.height);
			} else {
				this.material.uniforms.textureSize.value = new THREE.Vector2(readBuffer.width, readBuffer.height);
			}
		}
	}

	this.composer.quad.material = this.material;

	if (this.renderToScreen) {
		renderer.render(scene, camera);

	} else {
		renderer.render(scene, camera, writeBuffer, this.clear);
	}
};

// Exports.
module.exports = ShaderPass;