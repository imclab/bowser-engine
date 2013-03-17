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

	this.uniforms = THREE.UniformsUtils.clone(this.shader.uniforms);

	if (this.shader instanceof THREE.ShaderMaterial) {
		this.material = this.shader;

	} else {
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: this.shader.vertexShader,
			fragmentShader: this.shader.fragmentShader

		});
	}

	this.renderToScreen = false;
	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;
};

ShaderPass.prototype = {

	render: function() {
		var renderer = this.composer.game.renderer;
		var writeBuffer = this.composer.writeBuffer;
		var readBuffer = this.composer.readBuffer;
		var camera = this.composer.camera;
		var scene = this.composer.scene;
		var delta = this.composer.game.delta;

		if (this.uniforms[this.textureID]) {
			this.uniforms[this.textureID].value = readBuffer;
		}

		if (this.uniforms['textureSize']) {
			this.uniforms['textureSize'].value = new THREE.Vector2(readBuffer.width, readBuffer.height);
		}

		if (this.uniforms['textureSizePow2']) {
			this.uniforms['textureSizePow2'].value = new THREE.Vector2(Math.pow(readBuffer.width, 2), Math.pow(readBuffer.height, 2));
		}

		this.composer.quad.material = this.material;

		if (this.renderToScreen) {
			renderer.render(scene, camera);

		} else {
			renderer.render(scene, camera, writeBuffer, this.clear);
		}

	}

};

// Exports.
module.exports = ShaderPass;