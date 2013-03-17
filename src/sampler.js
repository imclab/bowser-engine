// Imports
var WATCHJS = require('watchjs');

/**
 * @constructor
 * @param {Game} game The game the sound will be running in.
 * @param {String} url URL to the sound file.
 */
var Sampler = function(game, parameters) {
    if (webkitAudioContext) {

        // Initializing audio context.
        this.context = new webkitAudioContext();
        this.gain = this.context.createGainNode();
        this.gain.connect(this.context.destination);
        this.listener = undefined;

        var that = this;

        WATCHJS.watch(that, 'doppler', function() {
            that.context.listener.dopplerFactor = that.doppler;
        });

        WATCHJS.watch(that, 'volume', function() {
            that.gain.gain.value = that.volume;
        });

        // Treating parameters
        parameters = parameters ? parameters : {};
        this.volume = parameters.volume ? parameters.volume : 1;
        this.doppler = parameters.doppler ? parameters.doppler : 0;
    }
};

Sampler.prototype.update = function() {
    if (webkitAudioContext) {
        if (this.listener) {
            var position = new THREE.Vector3().getPositionFromMatrix(this.listener.matrixWorld);
            this.context.listener.setPosition(position.x, position.y, position.z);
            if (this.context.listener.dopplerFactor) {
                this.context.listener.setVelocity(this.listener.velocity.x, this.listener.velocity.y, this.listener.velocity.z);
            }
        }
    }
};

// Exports.
module.exports = Sampler;
