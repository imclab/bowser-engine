/**
 * Initializes the resolution object.
 * @constructor
 * @returns {Resolution} A resolution object.
 */
var That = function(parameters) {
    "use strict";
    parameters = parameters ? parameters : {};
    this.width = parameters.width ? parameters.width : 0;
    this.height = parameters.height ? parameters.height : 0;
    this.adaptive = parameters.adaptive !== undefined ? parameters.adaptive : true;
    this.stretch = parameters.stretch !== undefined ? parameters.stretch : true;
};

/**
 * Returns the image ratio of that resolution.
 * @returns {Number}
 */
That.prototype.getImageRatio = function() {
    return this.width / this.height;
};

/**
 * Returns if the resolution is valid. Basically if width and height are greater than zero.
 * @returns {Boolean}
 */
That.prototype.isValid = function() {
    return (this.width > 0 && this.height > 0) ? true : false;
};

module.exports = That;