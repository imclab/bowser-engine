// Imports.
var THREE = require('three');
var WATCHJS = require('watchjs');
var CopyShader = require('./shader/copy');
var ShaderPass = require('./pass/shader');
var RenderPass = require('./pass/render');

/**
 * The composer object allows to overlay several scenes as well as shaders passes.
 * The code for this object is based on atleredq's THREE.EffectComposer.
 * @constructor
 */
var Composer = function(game) {
    "use strict";
    var that = this;

    // Inititalizing properties.
    this.game = game;
    this.output = null;
    this.copyPassPosition = 0;

    this.parameters = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat,
        stencilBuffer: true
    };

    this.renderTarget1 = new THREE.WebGLRenderTarget(100, 100, this.parameters);

    if (this.renderTarget1 === undefined) {
        var width = window.innerWidth || 1;
        var height = window.innerHeight || 1;
        this.renderTargetParameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat,
            stencilBuffer: false
        };
        this.renderTarget1 = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters);
    }

    // Add watchers.
    WATCHJS.watch(that, 'output', function() {
        for (var key in that.passes) {
            that.passes[key].renderToScreen = parseInt(that.output, 10) === parseInt(key, 10) ? true : false;
        }
    });

    this.renderTarget2 = this.renderTarget1.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.passes = [];
    this.copyPass = new ShaderPass({
        composer: this,
        shader: CopyShader
    });
};

Composer.prototype = {

    /**
     * Sets the resolution of the composer by resetting the THREE.WebGLRenderTarget.
     * @param {Number} width
     * @param {Number} height
     * @returns {undefined}
     */
    setResolution: function(width, height) {
        this.reset(new THREE.WebGLRenderTarget(width, height, this.parameters));
    },

    /**
     * Adds a pass at the top of the composer stack.
     * @returns {undefined}
     */
    add: function(pass) {
        var copyPass;

        // Adding the composer to the pass. Needed at render time.
        pass.composer = this;

        // Only the first pass of the stack should clear.
        pass.clear = !this.passes.length ? true : false;

        // I allow to pass a shader to create the shader pass automatically.
        if (pass instanceof THREE.ShaderMaterial) {
            pass = new ShaderPass({
                composer: this,
                shader: pass
            });
        }

        if (pass instanceof RenderPass) {
            copyPass = true;
            if (this.passes[this.passes.length - 1] instanceof ShaderPass) {
                this.passes = this.passes.splice(0, this.passes.length - 1);
            }
        }

        this.passes.push(pass);

        // For some reason we need a copy pass after all render passes.
        if (copyPass) {
            this.passes.push(new ShaderPass({
                composer: this,
                shader: CopyShader
            }));
            copyPass = false;
        }

        this.output = this.passes.length - 1;
    },

    swapBuffers: function() {
        var tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;
    },

    render: function() {
        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        var delta = this.game.delta;
        var pass, i, il = this.passes.length;

        for (i = 0; i < il; i++) {
            pass = this.passes[i];
            if (!pass.enabled) continue;
            //pass.render(this.game.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);
            pass.render();

            if (pass.needsSwap) {
                this.swapBuffers();
            }
        }
    },

    reset: function(renderTarget) {
        this.renderTarget1 = renderTarget;
        if (this.renderTarget1 === undefined) {
            this.renderTarget1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, this.renderTargetParameters);
        }
        this.renderTarget2 = this.renderTarget1.clone();
        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;
    }

};

// Shared orthographic camera.
Composer.prototype.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
Composer.prototype.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
Composer.prototype.scene = new THREE.Scene();
Composer.prototype.scene.add(Composer.prototype.quad);

// Exports
module.exports = Composer;