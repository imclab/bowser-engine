// Library imports.
var THREE = require('three');
var PATH = require('path');
var WATCHJS = require('watchjs');

// Class imports.
var Base = require('./base');
var Misc = require('./misc');

/**
 * The Loader object manages get requests and data in order to prevent duplicate requests.
 */
var Loader = function() {
    var that = this;

    // Calling super.
    Base.call(this);

    // Initializing properties.
    this.orders = 0;
    this.done = true;
    this.processing = false;
    this.callbacks = {};
    this.callbacks.done = [];

    // Add Watcher.
    WATCHJS.watch(that, 'orders', function() {
        if (that.orders === 0) {

            // Calling the callback in the order they were registered.
            for (var key in that.callbacks.done) {
                that.callbacks.done[key]();
            }

            // Clear the callbacks.
            that.callbacks.done = [];

            // Setting variables.
            that.processing = false;
            that.done = true;
        }
    });

    this.imageLoader = new THREE.ImageLoader();
    this.types = {
        '.wav': 'audio',
        '.mp3': 'audio',
        '.ogg': 'audio',
        '.png': 'image',
        '.jpg': 'image',
        '.gif': 'image',
        '.json': 'json'
    };
};

Loader.prototype = Object.create(Base.prototype);

Loader.prototype.assets = {};

Loader.prototype.registerCallback = function(type, callback) {
    this.callbacks[type].push(callback);
};

Loader.prototype.get = function(url, callback) {

    // Setting done.
    this.processing = true;
    this.done = false;

    // Normalizing URL.
    url = PATH.normalize(url);

    // Treating callback.
    callback = callback instanceof Function ? callback : function() {};

    // Getting extension and type.
    var extension = PATH.extname(url);
    var type = this.types[extension];

    // If URL is already loaded we just return the data.
    if (type !== 'image') {
        if (this.assets[url]) {
            callback(this.assets[url]);
            return this.assets[url];
        }
    }

    // Otherwise we do the approriate loading.
    switch (type) {
        case 'image':
            return this.getImage(url, callback);
        case 'audio':
            this.getAudio(url, callback);
            break;
        case 'json':
            this.getJSON(url, callback);
            break;
        default:
            this.getDefault(url, callback);
            break;
    }
};

Loader.prototype.getDefault = function(url, callback) {
    var that = this;

    this.orders += 1;
    request = new XMLHttpRequest();
    request.open('GET', url);
    request.onload = function() {
        that.assets[url] = this.responseText;
        that.orders -= 1;
        callback(this.responseText);
    };
    request.send();
};

Loader.prototype.getAudio = function(url, callback) {
    var that = this;

    this.orders += 1;
    request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        that.assets[url] = this.response;
        that.orders -= 1;
        callback(this.response);
    };
    request.send();
};

Loader.prototype.getJSON = function(url, callback) {
    var that = this;

    this.orders += 1;
    request = new XMLHttpRequest();
    request.open('GET', url);
    request.onload = function() {
        var json = JSON.parse(this.responseText);
        that.assets[url] = json;
        that.orders -= 1;
        callback(json);
    };
    request.send();
};

Loader.prototype.getImage = function(url, callback) {
    var that = this;

    this.orders += 1;
    var image = new Image();
    image.onload = function() {
        that.orders -= 1;
        callback(image);
    };
    image.src = url;
    this.assets[url] = image;
    return image;
};

// Exports.
module.exports = Loader;