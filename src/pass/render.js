// Imports.
var THREE = require('three');

/**
 * @author alteredq
 */
var RenderPass = function(parameters) {

	// Handling parameters.
	parameters = parameters !== undefined ? parameters : {};
	this.composer = parameters.composer !== undefined ? paramerers.composer : this.composer;
	this.scene = parameters.scene;
	this.camera = parameters.camera;
	this.overrideMaterial = parameters.overrideMaterial;
	this.clearColor = parameters.clearColor;
	this.clearAlpha = parameters.clearAlpha !== undefined ? clearAlpha : 1;

	this.oldClearColor = new THREE.Color();
	this.oldClearAlpha = 1;
	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;
};

RenderPass.prototype = {

	render: function() {
		var renderer = this.composer.game.renderer;
		var writeBuffer = this.composer.writeBuffer;
		var readBuffer = this.composer.readBuffer;
		var delta = this.composer.game.delta;

		this.scene.overrideMaterial = this.overrideMaterial;

		if (this.clearColor) {
			this.oldClearColor.copy(renderer.getClearColor());
			this.oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearColor(this.clearColor, this.clearAlpha);
		}
		renderer.render(this.scene, this.camera, readBuffer, this.clear);
		if (this.clearColor) {
			renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
		}
		this.scene.overrideMaterial = null;
	}
};

// Exports.
module.exports = RenderPass;