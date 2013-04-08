// Imports.
var Base = require('../base');

/**
 * An action that allows your entity to jump.
 */
var Action = function() {
    Base.call(this);

    // Setting properties.
    this.entity = undefined;
};

Action.prototype = Object.create(Base.prototype);

/**
 * The update method.
 * @returns {undefined} [description]
 */
Action.prototype.update = function() {};

Action.prototype.setEntity = function(entity) {
    if (entity) {
        entity.actions[this.key] = this;
    }
    this.entity = entity;
};

// Exports.
module.exports = Action;