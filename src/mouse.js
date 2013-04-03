// Imports.
var THREE = require('three');

/**
 * Initializes the keyboard object in order to control the keyboard.
 * @constructor
 * @returns {Mouse} A keyboard instance.
 */
var Mouse = function(game) {
    "use strict";
    this.game = game;

    // Initializing buttons.
    this.buttons = {};
    this.buttons.left = {};
    this.buttons.left.state = 'mouseup';
    this.buttons.left.hit = false;
    this.buttons.left.lift = false;
    this.buttons.left.hold = 0;
    this.buttons.left.pressed = false;
    this.buttons.left.value = 0;

    this.position = {};
    this.position.screen = new THREE.Vector2();
    this.position.world = new THREE.Vector3();
    this.displacement = new THREE.Vector2();
    this.projector = new THREE.Projector();
};

/**
 * Updates the keyboard status.
 * @method
 * @returns {undefined}
 */
Mouse.prototype.update = function() {

    if(this.buttons.left.state === 'mousedown') {
        this.buttons.left.pressed = true;
        this.buttons.left.hold += 1;
        this.buttons.left.hit = this.buttons.left.state !== this.buttons.left.previousState;
        this.buttons.left.value = Math.min(this.buttons.left.value + this.sensitivity, 1);
    } else {
        this.buttons.left.lift = this.buttons.left.state !== this.buttons.left.previousState;
        this.buttons.left.pressed = false;
        this.buttons.left.hit = false;
        this.buttons.left.hold = 0;
        this.buttons.left.value = Math.max(this.buttons.left.value - this.sensitivity, 0);
    }
    this.buttons.left.previousState = this.buttons.left.state;
};

/**
 * Sets the state of the provided key.
 * @method
 * @param {event} A MouseEvent.
 * @returns {undefined}
 */
Mouse.prototype.setButtonState = function(event) {
    this.buttons.left.state = event.type;
    this.buttons.left.alt = event.altKey;
    this.buttons.left.shift = event.shiftKey;
    this.buttons.left.ctrl = event.ctrlKey;
};

/**
 * Sets the state of the provided key.
 * @method
 * @param {event} A MouseEvent event.
 * @returns {undefined}
 */
Mouse.prototype.setPosition = function(event) {

    // Calculating new position based on bottom left corner.
    var x = event.clientX - this.game.div.offsetLeft;
    var y = this.game.div.offsetHeight - (event.clientY - this.game.div.offsetTop);

    if (this.locked) {
        this.displacement.x = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.displacement.y = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    } else {
        this.displacement.x = x - this.position.screen.x;
        this.displacement.y = y - this.position.screen.y;
    }

    this.position.screen.x = x;
    this.position.screen.y = y;

    // The old Mike's stuff probably useful later.
    // event.preventDefault();
    // this.position.world.x = ( (event.clientX - this.game.div.offsetLeft) / (window.innerWidth - this.game.div.offsetLeft * 2) ) * 2 - 1;
    // this.position.world.y = - ( (event.clientY - this.game.div.offsetTop) / (window.innerHeight - this.game.div.offsetTop * 2) ) * 2 + 1;
    // this.position.screen.x = this.game.resolution.height - (((event.clientY - this.game.div.offsetTop) / (window.innerHeight - this.game.div.offsetTop * 2)) * this.game.resolution.height);
    // this.position.screen.y = event.clientX - this.game.div.offsetLeft;
};

// Exports.
module.exports = Mouse;