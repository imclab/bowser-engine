var THREE = require('three');
var WATCHJS = require('watchjs');
var Entity = require('../entity');
var Misc = require('../misc');

/**
 * Entity used in a Scene2D.
 * @param {Game} game A game instance.
 */
var Entity2D = function(parameters) {
    "use strict";
    Entity.call(this, parameters);
    var that = this;

    // Loading the map.
    this.texture = THREE.ImageUtils.loadTexture(parameters.image, new THREE.UVMapping(), function() {
        that.sprite.scale.set(that.texture.image.width, that.texture.image.height, 1.0);
    });

    // Creating sprite object.
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.texture,
        useScreenCoordinates: false,
        depthTest: false,
        scaleByViewport: true,
        alignment: THREE.SpriteAlignment.bottomLeft
    }));

    // Adding stuff to the entity.
    this.add(this.sprite);

    // Adding watchers.
    WATCHJS.watch(that, 'filtering', function() {
        that.texture.magFilter = parameters.filtering ? THREE.LinearFilter : THREE.NearestFilter;
        that.texture.minFilter = parameters.filtering ? THREE.LinearMipMapLinearFilter : THREE.NearestMipMapNearestFilter;
    });

    WATCHJS.watch(that, 'offset', function() {
        that.sprite.position = that.offset;
        that.sprite.updateMatrix();
    });

    WATCHJS.watch(that, 'visible', function() {
        that.sprite.visible = that.visible;
    });

    // Treating parameters.
    parameters = parameters ? parameters : {};
    this.offset = parameters.offset ? parameters.offset : new THREE.Vector3(0, 0, 0);
    this.coordinates = {};
    this.animations = {};
    this.animation = parameters.animation ? parameters.animation : '';
    this.flipped = false;
    this.frame = '';
    this.filtering = parameters.filtering ? parameters.filtering : false;

    if (parameters.coordinates) {
        Misc.getJSON(parameters.coordinates, function(json) {
            that.coordinates = json.frames;
        });
    }

    if (parameters.animations) {
        Misc.getJSON(parameters.animations, function(json) {
            that.animations = json.animations;
        });
    }
};

Entity2D.prototype = Object.create(Entity.prototype);

Entity2D.prototype.setFrame = function(frame, flipped) {
    this.frame = frame;
    frame = this.coordinates[frame];

    if (flipped) {
        this.sprite.material.uvOffset.x = (frame.frame.x + frame.frame.w) / this.texture.image.width;
    } else {
        this.sprite.material.uvOffset.x = (frame.frame.x) / this.texture.image.width;
    }
    this.sprite.material.uvOffset.y = 1 - (frame.frame.y + frame.frame.h) / this.texture.image.height;

    this.sprite.material.uvScale.x = (flipped ? -1 : 1) * frame.frame.w / this.texture.image.width;
    this.sprite.material.uvScale.y = frame.frame.h / this.texture.image.height;

    this.sprite.scale.x = frame.frame.w;
    this.sprite.scale.y = frame.frame.h;
};

Entity2D.prototype.update = function() {
    Entity.prototype.update.call(this);

    var frames;
    if (this.scene.game.frame % 8 === 0) {
        if (this.animations[this.animation]) {
            if (this.animations[this.animation].alias) {
                frames = this.animations[this.animations[this.animation].alias].frames;
            } else {
                frames = this.animations[this.animation].frames;
            }
            var index = frames.indexOf(this.frame);
            if (index < 0) {
                this.setFrame(frames[0], this.flipped);
            } else {
                this.setFrame(frames[(index + 1) % frames.length], this.flipped);
            }
        }
    }
};

// Exports.
module.exports = Entity2D;