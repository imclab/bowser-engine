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
        if (parameters.coordinates) {
            Misc.getJSON(parameters.coordinates, function(json) {
                that.coordinates = json.frames;
                that.onLoad();
            });
        } else {
            that.onLoad();
        }
    });

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
    parameters = parameters ? parameters : {};
    this.offset = parameters.offset ? parameters.offset : new THREE.Vector3(0, 0, 0);
    this.coordinates = {};
    this.animations = {};
    this.delta = 0;
    this.animation = parameters.animation ? parameters.animation : '';
    this.sprite = parameters.sprite ? parameters.sprite : '';
    this.flipped = false;
    this.frame = 0;
    this.filtering = parameters.filtering ? parameters.filtering : false;

    if (parameters.animations) {
        Misc.getJSON(parameters.animations, function(json) {
            that.animations = json.animations;
        });
    }
};

Entity2D.prototype = Object.create(Entity.prototype);

Entity2D.prototype.onLoad = function() {
    // We set the material of the sprite.
    this.mesh.material.map = this.texture;

    // We only set the sprite scale for the full image if it's not a sprite sheet.
    if (Object.keys(this.coordinates).length) {
        this.setSprite(this.sprite);
    }

    this.setSize();
};

Entity2D.prototype.setAnimation = function(animation) {
    this.frame = 0;
    this.animation = animation;
};

Entity2D.prototype.setSprite = function(sprite, flipped) {
    this.sprite = sprite;
    sprite = this.coordinates[sprite];

    if (sprite) {
        if (flipped) {
            this.mesh.material.uvOffset.x = (sprite.frame.x + sprite.frame.w) / this.texture.image.width;
        } else {
            this.mesh.material.uvOffset.x = (sprite.frame.x) / this.texture.image.width;
        }
        this.mesh.material.uvOffset.y = 1 - (sprite.frame.y + sprite.frame.h) / this.texture.image.height;

        this.mesh.material.uvScale.x = (flipped ? -1 : 1) * sprite.frame.w / this.texture.image.width;
        this.mesh.material.uvScale.y = sprite.frame.h / this.texture.image.height;
    }

    this.setSize();
};

Entity2D.prototype.setSize = function() {
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
        this.mesh.scale.set(this.texture.image.width * upscale, this.texture.image.height * upscale);
    }
};

Entity2D.prototype.onResize = function() {
    this.setSize();
};

Entity2D.prototype.update = function() {
    Entity.prototype.update.call(this);

    if (this.animations[this.animation]) {
        var animation = this.animations[this.animation];
        this.delta += this.scene.game.delta;
        var frames = animation.alias && this.animations[animation.alias] ? this.animations[animation.alias].frames : animation.frames;
        if (this.delta > frames[this.frame].duration) {
            this.delta = 0;
            this.frame = (this.frame + 1) % frames.length;
            this.setSprite(frames[this.frame].sprite, animation.flipped);
        }
    }
};

// Exports.
module.exports = Entity2D;