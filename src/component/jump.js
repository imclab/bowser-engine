// Imports.
var Component = require('../component');

/**
 * A component that allows your entity to jump.
 */
var JumpComponent = function(parameters) {
    Component.call(this);

    // Setting properties.
    this.phase = 'grounded';

    // Handling parameters.
    parameters = parameters ? parameters : {};
    this.key = parameters.key ? parameters.key : 'jump';
    this.trigger = parameters.trigger ? parameters.trigger : 0;
    this.retain = parameters.retain ? parameters.retain : 0;
    this.potential = parameters.potential ? parameters.potential : 200;
    this.cutoff = parameters.cutoff ? parameters.cutoff : 15;
};

JumpComponent.prototype = Object.create(Component.prototype);

/**
 * The update method.
 * @returns {undefined} [description]
 */
JumpComponent.prototype.update = function() {
    Component.prototype.update.call(this);

    var trigger = this.entity.scene.game.keyboard.getKey(this.trigger);

    if (this.phase === 'start') {
        this.phase = 'impulsion';
    }

    // When a collision happens.
    if(this.entity.collisions.length) {
        this.retain = 1;
        // if (this.phase === 'descent') {
        //     this.phase = 'landing';
        // } else {
        //     this.phase = 'grounded';
        // }
    }

    // Setting the phase impulsion;
    if (this.retain && trigger.hit) {
        this.phase = 'start';
    }

    // During the impulsion.
    if(this.phase === 'start' || this.phase === 'impulsion') {
        if(trigger.pressed && this.retain && trigger.hold < this.cutoff) {
            this.entity.velocity.y = this.potential / this.entity.mass;
        } else {
            this.phase = 'ascension';
        }
    }

    if (this.phase === 'ascension' && this.entity.velocity.y < 0) {
        this.phase = 'descent';
    }

    if(trigger.lift || this.entity.velocity.y < 0) {
        this.impulsion = false;
        this.retain = this.retain > 0 ? this.retain - 1 : 0;
    }
};


// Exports.
module.exports = JumpComponent;