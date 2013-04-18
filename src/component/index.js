// Class imports.
var Base = require('../base');

/**
 * An action that allows your entity to jump.
 */
var Component = function() {
    Base.call(this);

    // Setting properties.
    this.entity = undefined;
};

Component.prototype = Object.create(Base.prototype);

/**
 * The update method.
 * @returns {undefined} [description]
 */
Component.prototype.update = function() {};

Component.prototype.setEntity = function(entity) {
    if (entity) {
        entity.components[this.key] = this;
    }
    this.entity = entity;
};

// Exports.
module.exports = Component;