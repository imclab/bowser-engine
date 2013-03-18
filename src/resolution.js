/**
 * Initializes the resolution object.
 * @constructor
 * @returns {Resolution} A resolution object.
 */
var Resolution = function(parameters) {
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
Resolution.prototype.getImageRatio = function() {
    return this.width / this.height;
};

/**
 * Returns if the resolution is valid. Basically if width and height are greater than zero.
 * @returns {Boolean}
 */
Resolution.prototype.isValid = function() {
    return (this.width > 0 && this.height > 0) ? true : false;
};

module.exports = Resolution;