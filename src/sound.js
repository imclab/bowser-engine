// Imports.
var THREE = require('three');
var WATCHJS = require('watchjs');

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
    this.key = parameters.key ? parameters.key : this.id;
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

    if (webkitAudioContext) {

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
        this.autoplay = parameters.autoplay ? parameters.autoplay : false;
        this.url = parameters.url;
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

Sound.prototype.init = function() {
    var that = this;

    // Registering in the entity.
    if (this.entity) {
        this.entity.sounds[this.key] = this;
        if (this.entity.scene && this.entity.scene.game) {
            this.sampler = this.entity.scene.game.sampler;
        }
    }

    // Registering in the scene.
    if (this.scene) {
        this.scene.sounds[this.key] = this;
        if (this.scene.game) {
            this.sampler = this.scene.game.sampler;
        }
    }

    // Basically we can only load and attach the sound when the sound object is connected to a game.
    if (this.sampler && !(this.analyser)) {
        this.analyser = this.sampler.context.createAnalyser();
        this.gain = this.sampler.context.createGainNode();
        this.gain.gain.value = this.volume;

        if(this.panner) {
            this.panner = this.sampler.context.createPanner();
            this.panner.setPosition(this.position.x, this.position.y, this.position.z);
            that.panner.rolloffFactor = that.attenuation;
            this.gain.connect(this.panner);
            this.panner.connect(this.sampler.gain);
        } else {
            this.gain.connect(this.sampler.gain);
        }

        var request = new XMLHttpRequest();
        request.open('GET', this.url, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            that.sampler.context.decodeAudioData(request.response, function(buffer) {
                that.buffer = buffer;
                if(that.autoplay) {
                    that.play();
                }
            });
        };
        request.send();
    }
};

Sound.prototype.update = function() {
    if (webkitAudioContext) {
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