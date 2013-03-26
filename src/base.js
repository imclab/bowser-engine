/**
 * The base object would ideally be the parent for any bowser-engine object.
 * Unfortunately it's currently not being used everywhere since some of the classes are inheriting from three.js classes.
 * We are thinking about implementing multiple inheritance for these.
 */
var Base = function() {};

/**
 * Returns an extented version of the base class using prototypal inheritance.
 * The function is inspired from John Resig's Javascript Simple Inheritance article.
 * @param {Object} extension An object containing what will be added to the extended entity prototype.
 * @param {Object} mother You can provide a mother "class" if the object inherits from several class.
 */
Base.extend = function(extensions) {
    var that = this;
    extensions = extensions instanceof Object ? extensions : {};

    function Class () {
        if (extensions.construct) {
            extensions.construct.apply(this, arguments);
        } else {
            that.apply(this, arguments);
        }
    }

    Class.prototype = Object.create(this.prototype);

    for (var key in extensions) {
        if (key !== 'construct') {
            Class.prototype[key] = extensions[key];
        }
    }

    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
};

/**
 * Convenience function get the value of a parameter and fallback to a default value.
 */
Base.prototype.getParameter = function(parameters, key, fallback) {
    return parameters[key] !== undefined ? parameters[key] : fallback;
};

// Exports.
module.exports = Base;