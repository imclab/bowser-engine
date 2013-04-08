// Library imports.
var THREE = require('three');
var WATCHJS = require('watchjs');

// Class imports.
var Loader = require('./loader');

/**
 * @constructor
 * @param {Game} game The game the sound will be running in.
 * @param {String} url URL to the sound file.
 */
var Sound = function(parameters) {
    "use strict";
    var that = this;

    // Treating parameters
    parameters = parameters ? parameters : {};
    this.parameters = parameters;
    this.key = parameters.key ? parameters.key : this.id;
    this.loader = new Loader();
    this.entity = undefined;
    this.scene = undefined;
    this.radius = parameters.radius !== undefined ? parameters.radius : 10;

    // Initializing the super object.
    THREE.Mesh.call(this, new THREE.SphereGeometry(this.radius), new THREE.MeshBasicMaterial({
        color: 0xffc844,
        transparent: true,
        opacity: 0.0
    }));

    // Treating more parameters.
    this.visible = parameters.visible !== undefined ? parameters.visible : false;

    if (window.webkitAudioContext) {

        // Adding watchers.        
        WATCHJS.watch(that, 'volume', function() {
            if (that.gain) {
                that.gain.gain.value = that.volume;
            }
        });

        WATCHJS.watch(that, 'attenuation', function() {
            if (that.panner) {
                that.panner.rolloffFactor = that.attenuation;
            }
        });

        // Finishing to process parameters.
        this.size = parameters.size ? parameters.size : 1;
        this.position = parameters.position ? parameters.position : this.position;
        this.panner = parameters.panner ? parameters.panner : false;
        this.doppler = parameters.doppler ? parameters.doppler : false;
        this.buffer = undefined;
        this.volume = parameters.volume ? parameters.volume : 1;
        this.attenuation = parameters.attenuation ? parameters.attenuation : 1;
    }
};

Sound.prototype = Object.create(THREE.Mesh.prototype);

Sound.prototype.play = function() {
    if (webkitAudioContext) {
        if(this.buffer && this.sampler) {
            this.source = this.sampler.context.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(this.gain);
            this.source.connect(this.analyser);
            this.source.noteOn(0);
        }
    }
};

Sound.prototype.amplitude = function(){
    if (webkitAudioContext) {
        var width = 4;
        var freqByte = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqByte);
        var sum = 0;
        for(var i = 0; i < width; i++){
            sum += freqByte[i];
        }
        return sum / (width*256-1);
    } else {
        return 0;
    }
};

Sound.prototype.add = function(object) {
    console.warn('Cannot add anything to sound ' + object.key + '. Skipping.');
};

Sound.prototype.setGame = function(game) {
    if (game) {

        var that = this;

        this.sampler = game.sampler;
        this.game = game;

        this.loader.get(this.parameters.url, function(data) {
            that.sampler.context.decodeAudioData(data, function(buffer) {
                that.buffer = buffer;
                if (that.parameters.play) {
                    that.play();
                }
            });
        });

        // Basically we can only attach the sound when the sound object is connected to a game.
        if (!(this.analyser)) {
            this.analyser = this.sampler.context.createAnalyser();
            this.gain = this.sampler.context.createGainNode();
            this.gain.gain.value = this.volume;
        }

        if(this.panner) {
            this.panner = this.sampler.context.createPanner();
            this.panner.setPosition(this.position.x, this.position.y, this.position.z);
            that.panner.rolloffFactor = that.attenuation;
            this.gain.connect(this.panner);
            this.panner.connect(this.sampler.gain);

        } else {
            this.gain.connect(this.sampler.gain);
        }
    }
};

Sound.prototype.setScene = function(scene) {
    if (scene) {

        // Register the sound in the scene.
        scene.sounds[this.key] = this;

        // Connecting the sound to the game sampler.
        if (scene.game) {
            this.sampler = scene.game.sampler;
        }

        // Setting the scene pointer.
        this.scene = scene;
    }
};

Sound.prototype.setEntity = function(entity) {
    if (entity) {

        // Register the sound in the entity.    
        entity.sounds[this.key] = this;

        // Connecting the sound to the game sampler.
        if (entity.scene && entity.scene.game) {
            this.sampler = entity.scene.game.sampler;
        }

        // Setting the scene pointer.
        this.entity = entity;
    }
};

Sound.prototype.update = function() {
    if (window.webkitAudioContext) {

        if(this.panner) {
            var position = new THREE.Vector3().getPositionFromMatrix(this.matrixWorld);
            this.panner.setPosition(position.x ,position.y, position.z);
            if (this.doppler) {
                if (this.parent.velocity) {
                    this.panner.setVelocity(this.parent.velocity.x, this.parent.velocity.y, this.parent.sampler.listener.velocity.z);
                }
            }
        }
        if (this.visible) {
            var amplitude = this.amplitude();
            var scale = this.size * amplitude;
            this.material.opacity = amplitude;
            if (scale) {
                this.scale.set( scale, scale, scale );
            }
        }
    }
};

module.exports = Sound;