// Imports.
var THREE = require('three');

/**
 * Initializes the keyboard object in order to control the keyboard.
 * @constructor
 * @returns {Keyboard} A keyboard instance.
 */
var Keyboard = function(game) {
	"use strict";
	this.game = game;
	this.keys = {};
	this.sensitivity = 0.1;
};

/**
 * Updates the keyboard status.
 * @method
 * @returns {undefined}
 */
Keyboard.prototype.update = function() {
	for(var key in this.keys) {
		if(this.keys[key].state === 'keydown') {
			this.keys[key].pressed = true;
			this.keys[key].hold += 1;
			this.keys[key].hit = this.keys[key].state !== this.keys[key].previousState;
			this.keys[key].value = Math.min(this.keys[key].value + this.sensitivity, 1);
		} else {
			this.keys[key].lift = this.keys[key].state !== this.keys[key].previousState;
			this.keys[key].pressed = false;
			this.keys[key].hit = false;
			this.keys[key].hold = 0;
			this.keys[key].value = Math.max(this.keys[key].value - this.sensitivity, 0);
		}
		this.keys[key].previousState = this.keys[key].state;
	}
};

/**
 * Sets the state of the provided key.
 * @method
 * @param {event} A KeyboardEvent.
 * @returns {undefined}
 */
Keyboard.prototype.setKeyState = function(event) {
	var key = event.keyCode;
	if(this.keys[key]) {
		this.keys[key].state = event.type;
		this.keys[key].alt = event.altKey;
		this.keys[key].shift = event.shiftKey;
		this.keys[key].ctrl = event.ctrlKey;
	}
};

/**
 * Gets the key object for the provided key code.
 * @method
 * @param  {String} key The key code for the desired key object.
 * @returns {undefined}
 */
Keyboard.prototype.getKey = function(key) {

	// Key get registered if called for the first time.
	if(!this.keys[key]) {
		this.keys[key] = {};
		this.keys[key].state = 'keyup';
		this.keys[key].hit = false;
		this.keys[key].lift = false;
		this.keys[key].hold = 0;
		this.keys[key].pressed = false;
		this.keys[key].value = 0;
	}

	return this.keys[key];
};

// Exports.
module.exports = Keyboard;