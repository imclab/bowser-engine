// Imports.
var THREE = require('three');
var Entity3D = require('./3d/entity');

/**
 * Creates a grid of lines to make it easier to visualize the cordinates in the scene.
 * @constructor
 * @returns {Grid} A Grid object.
 */
var That = function(parameters) {
    Entity3D.call(this, parameters);

    var i, geometry = new THREE.Geometry();

    // X Axis XY plane.
    for (i = -1 * (parameters.size.x / 2); i <= (parameters.size.x / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3(i, (parameters.size.y / 2), 0));
            geometry.vertices.push(new THREE.Vector3(i, (parameters.size.y / 2) * -1, 0));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3(i, (parameters.size.y / 2), 0));
            geometry.vertices.push(new THREE.Vector3(i, 1, 0));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(i, -1, 0));
            geometry.vertices.push(new THREE.Vector3(i, (parameters.size.y / 2) * -1, 0));
        }
    }

    // Y Axis XY plane.
    for (i = -1 * (parameters.size.y / 2); i <= (parameters.size.y / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2), i, 0));
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2) * -1, i, 0));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2), i, 0));
            geometry.vertices.push(new THREE.Vector3(1, i, 0));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(-1, i, 0));
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2) * -1, i, 0));
        }
    }
    // Z Axis ZY Plane
    for (i = -1 * (parameters.size.z / 2); i <= (parameters.size.z / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3(0, (parameters.size.y / 2), i));
            geometry.vertices.push(new THREE.Vector3(0, (parameters.size.y / 2) * -1, i));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3(0, (parameters.size.y / 2), i));
            geometry.vertices.push(new THREE.Vector3(0, 1, i));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(0, -1, i));
            geometry.vertices.push(new THREE.Vector3(0, (parameters.size.y / 2) * -1, i));
        }
    }

    // Y Axis ZY Plane
    for (i = -1 * (parameters.size.y / 2); i <= (parameters.size.y / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3(0, i, (parameters.size.z / 2), i));
            geometry.vertices.push(new THREE.Vector3(0, i, (parameters.size.z / 2) * -1, i));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3(0, i, (parameters.size.z / 2), i));
            geometry.vertices.push(new THREE.Vector3(0, i, 1));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(0, i, -1));
            geometry.vertices.push(new THREE.Vector3(0, i, (parameters.size.z / 2) * -1));
        }
    }

    // Z Axis XZ Plane
    for (i = -1 * (parameters.size.z / 2); i <= (parameters.size.z / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2), 0, i));
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2) * -1, 0, i));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2), 0, i));
            geometry.vertices.push(new THREE.Vector3(1, 0, i));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(-1, 0, i));
            geometry.vertices.push(new THREE.Vector3((parameters.size.x / 2) * -1, 0, i));
        }
    }

    // X Axis XZ Plane
    for (i = -1 * (parameters.size.x / 2); i <= (parameters.size.x / 2); i++) {
        if (i) {
            geometry.vertices.push(new THREE.Vector3(i, 0, (parameters.size.z / 2), i));
            geometry.vertices.push(new THREE.Vector3(i, 0, (parameters.size.z / 2) * -1, i));
        } else {

            // Positive space.
            geometry.vertices.push(new THREE.Vector3(i, 0, (parameters.size.z / 2), i));
            geometry.vertices.push(new THREE.Vector3(i, 0, 1));

            // Negative space.
            geometry.vertices.push(new THREE.Vector3(i, 0, -1));
            geometry.vertices.push(new THREE.Vector3(i, 0, (parameters.size.z / 2) * -1));
        }
    }
    geometry.computeBoundingSphere();
    this.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: 0x000000
    }), THREE.LinePieces));

    // Origin X.
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, -1, 0));
    geometry.vertices.push(new THREE.Vector3(0, 1, 0));
    geometry.computeBoundingSphere();
    this.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: 0xff0000
    }), THREE.LinePieces));

    // Origin Y.
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1, 0, 0));
    geometry.vertices.push(new THREE.Vector3(1, 0, 0));
    geometry.computeBoundingSphere();
    this.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: 0x00ff00
    }), THREE.LinePieces));

    // Origin Z.
    geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, -1));
    geometry.vertices.push(new THREE.Vector3(0, 0, 1));
    geometry.computeBoundingSphere();
    this.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: 0x0000ff
    }), THREE.LinePieces));
};

That.prototype = Object.create(Entity3D.prototype);

// Exports.
module.exports = That;