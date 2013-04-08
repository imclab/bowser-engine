// Library imports.
var THREE = require('three');
var WATCHJS = require('watchjs');

// Class imports.
var Entity = require('../entity');
var Misc = require('../misc');

/**
 * Entity used in a Scene2D.
 * @param {Game} game A game instance.
 */
var Entity2D = function(parameters) {
    "use strict";

    // Calling super.
    Entity.call(this, parameters);

    // Setting that.
    var that = this;

    // Creating the previous object.
    this.previous = {};
    this.previous.animation = '';

    // Creating sprite object.
    this.mesh = new THREE.Sprite(new THREE.SpriteMaterial({
        useScreenCoordinates: false,
        depthTest: false,
        scaleByViewport: true,
        alignment: THREE.SpriteAlignment.bottomLeft
    }));

    // Adding stuff to the entity.
    this.add(this.mesh);

    // Adding watchers.
    WATCHJS.watch(that, 'filtering', function() {
        that.texture.magFilter = parameters.filtering ? THREE.LinearFilter : THREE.NearestFilter;
        that.texture.minFilter = parameters.filtering ? THREE.LinearMipMapLinearFilter : THREE.NearestMipMapNearestFilter;
    });

    WATCHJS.watch(that, 'offset', function() {
        that.mesh.position = that.offset;
        that.mesh.updateMatrix();
    });

    WATCHJS.watch(that, 'visible', function() {
        that.mesh.visible = that.visible;
    });

    // Treating parameters.
    this.offset = parameters.offset ? parameters.offset : new THREE.Vector3(0, 0, 0);
    this.coordinates = {};
    this.animations = {};
    this.animation = parameters.animation ? parameters.animation : '';
    this.sprite = parameters.sprite ? parameters.sprite : '';
    this.flipped = false;
    this.frame = 0;

    // Loading the assets.
    this.load();
};

Entity2D.prototype = Object.create(Entity.prototype);

Entity2D.prototype.setAnimation = function(animation) {
    this.previous.animation = this.animation;
    this.animation = animation;
};

Entity2D.prototype.setSprite = function(sprite, flipped) {
    this.sprite = sprite;
    sprite = this.coordinates[sprite];

    if (sprite) {
        var image = this.mesh.material.map.image;

        if (flipped) {
            this.mesh.material.uvOffset.x = (sprite.frame.x + sprite.frame.w) / image.width;
        } else {
            this.mesh.material.uvOffset.x = (sprite.frame.x) / image.width;
        }
        this.mesh.material.uvOffset.y = 1 - (sprite.frame.y + sprite.frame.h) / image.height;

        this.mesh.material.uvScale.x = (flipped ? -1 : 1) * sprite.frame.w / image.width;
        this.mesh.material.uvScale.y = sprite.frame.h / image.height;
    }

    this.setResolution();
};

Entity2D.prototype.setResolution = function() {
    var upscale = this.scene !== undefined ? this.scene.upscale : 1;

    // If we have sprite sheet coordinates.
    if (Object.keys(this.coordinates).length) {

        // If the spite is valid.
        if (this.coordinates[this.sprite]) {
            this.mesh.scale.x = this.coordinates[this.sprite].frame.w * upscale;
            this.mesh.scale.y = this.coordinates[this.sprite].frame.h * upscale;

            // If not we just scale it to zero.
        } else {
            this.mesh.scale.x = 0;
            this.mesh.scale.y = 0;
        }

        // If we do not we use the full image dimensions.
    } else {
        var image = this.mesh.material.map.image;
        this.mesh.scale.set(image.width * upscale, image.height * upscale);
    }
};

Entity2D.prototype.load = function(callback) {

    if (!this.loader.processing) {

        // Declaring.
        var that = this;

        // Loading the coordinates data.
        if (this.parameters.coordinates) {
            this.loader.get(this.parameters.coordinates, function(json) {
                that.coordinates = json.frames;
            });
        }

        // Loading the animation data.
        if (this.parameters.animations) {
            this.loader.get(this.parameters.animations, function(json) {
                that.animations = json.animations;
            });
        }

        // Loading the texture.
        var image = this.loader.get(this.parameters.image, function() {
            that.mesh.material.map.needsUpdate = true;
        });

        // Assigning the image to the mesh material.
        this.mesh.material.map = new THREE.Texture(image, new THREE.UVMapping());

        // Registering onLoad callback. 
        this.loader.registerCallback('done', function() {
            that.onLoad();
        });
    }

    // Register other given callback.
    if (callback instanceof Function) {
        this.loader.registerCallback('done', callback);
    }
};

Entity2D.prototype.onLoad = function() {

    // Setting the sprite based on parameters.
    if (this.parameters.sprite) {
        this.setSprite(this.parameters.sprite);
    }
    // Setting the animation based on parameters.
    if (this.parameters.animation) {
        this.setAnimation(this.parameters.animation);
    }
};

Entity2D.prototype.update = function() {
    Entity.prototype.update.call(this);

    // Checking if animation changed at this frame.
    var animationChanged = this.previous.animation !== this.animation;

    if (animationChanged) {
        this.frame = 0;
    }

    if (this.animations[this.animation]) {
        var animation = this.animations[this.animation];
        this.delta += this.scene.game.delta;
        var frames = animation.alias && this.animations[animation.alias] ? this.animations[animation.alias].frames : animation.frames;
        if (this.delta > frames[this.frame].duration || animationChanged) {
            this.delta = 0;
            this.setSprite(frames[this.frame].sprite, animation.flipped);
            this.frame = (this.frame + 1) % frames.length;
        }
    }

    // Setting the previous animation value.
    this.previous.animation = this.animation;
};

// Exports.
module.exports = Entity2D;