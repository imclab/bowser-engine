// Imports.
var THREE = require('three');
var Entity = require('../entity');

/**
 * The entity object represent the idea of an idependant self-mangage object. For instance a character or a vehicle.
 * @constructor
 * @param {Boolean} dynamic Entity will be moving.
 * @returns {Entity}
 */
var Entity3D = Entity.extend();

module.exports = Entity3D;
