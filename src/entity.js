// Library imports.
var THREE = require('three');
var WATCHJS = require('watchjs');

// Class imports.
var Action = require('./action');
var Loader = require('./loader');
var Scene3D = require('./3d/scene');

/**
 * The entity object represent the idea of an idependant self-mangage object. For instance a character or a vehicle.
 * Although broke out individually, arguments should be passed as a single parameters javascript object.
 * @param {Boolean} dynamic Determines if the entity will see its kinematic at each update as well as react to game physic.
 * @param {THREE.Vector3} position Position of the entity in space.
 * @param {Boolean} visible Defines if the entity is render visible.
 */
var Entity = function(parameters) {
    "use strict";

    // Calling super.
    THREE.Object3D.call(this);

    // Declaring.
    var key, that = this;

    // Initializing parameters.
    this.parameters = parameters ? parameters : {};

    // Creating loader.
    this.loader = new BOWSER.Loader();

    // Creating buffer object.
    this.buffer = {};
    this.buffer.raycaster = new THREE.Raycaster();
    this.buffer.updateStatic = false;
    this.buffer.positionWorld = new THREE.Vector3();
    this.buffer.zeroVector = new THREE.Vector3();
    this.buffer.flagUpdateStatic = function() {
        that.buffer.updateStatic = true;
    };

    // Creating previous object.
    this.previous = {};

    // Adding watchers.
    WATCHJS.watch(that, 'dynamic', function() {
        that.matrixAutoUpdate = that.dynamic;
        if (that.dynamic) {
            if (that.position.watchers) {
                WATCHJS.unwatch(that.position, that.buffer.flagUpdateStatic);
                WATCHJS.unwatch(that.rotation, that.buffer.flagUpdateStatic);
                WATCHJS.unwatch(that.scale, that.buffer.flagUpdateStatic);
            }
        } else {
            WATCHJS.watch(that.position, that.buffer.flagUpdateStatic);
            WATCHJS.watch(that.rotation, that.buffer.flagUpdateStatic);
            WATCHJS.watch(that.scale, that.buffer.flagUpdateStatic);
        }
    });

    WATCHJS.watch(that, 'visible', function() {
        for (var key in that.children) {
            if (that.children[key]._visible) {
                that.children[key].visible = that.visible * that.children[key]._visible;
                delete that.children[key]['_visible'];
            } else {
                that.children[key]._visible = that.children[key].visible;
                that.children[key].visible = that.visible * that.children[key]._visible;
            }
        }
    });

    // Update properties.
    parameters = parameters ? parameters : {};
    this.potential = parameters.potential ? parameters.potential : new THREE.Vector3();
    this.kinetic = parameters.kinetic instanceof THREE.Vector3 ? parameters.kinetic : new THREE.Vector3();

    this.dynamic = parameters.dynamic ? parameters.dynamic : false;

    if (parameters.position instanceof THREE.Vector3) {
        this.position.set(parameters.position.x, parameters.position.y, parameters.position.z);
    }

    // Setting properties.
    this.key = parameters.key ? parameters.key : this.id;
    this.visible = parameters.visible ? parameters.visible : true;
    this.entity = undefined;
    this.delta = 0;

    // Setting indicies properties.
    this.sounds = {};
    this.entities = {};
    this.colliders = {};
    this.actions = {};

    // Setting physics properties.
    this.cof = 0;
    this.recursion = 0;
    this.collisions = [];
    this.force = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.mass = parameters.mass ? parameters.mass : 1;
    this.displacement = new THREE.Vector3();
    this.elasticity = parameters.elasticity ? parameters.elasticity : 0.0;
    this.friction = new THREE.Vector3();
    this.normalForce = new THREE.Vector3();
    this.bounceForce = new THREE.Vector3();
    this.roughness = parameters.roughness ? parameters.roughness : 0.0;
    this.velocity = parameters.velocity ? parameters.velocity : new THREE.Vector3();

    // This stuff has to go away.
    this.onCollision = parameters.onCollision ? parameters.onCollision : function() {};
    this.onPreUpdate = parameters.onPreUpdate ? parameters.onPreUpdate : function() {};
    this.onPostUpdate = parameters.onPostUpdate ? parameters.onPostUpdate : function() {};
    this.onConstruction = parameters.onConstruction ? parameters.onConstruction : function() {};

    // Add colliders if any provided.
    var colliders = parameters.colliders ? parameters.colliders : [];
    for (key in colliders) {
        this.add(colliders[key]);
    }

    // Add entitites if any provided.
    var entities = parameters.entities ? parameters.entities : [];
    for (key in entities) {
        this.add(entities[key]);
    }

    // Launching custom construction.
    this.onConstruction();
};

Entity.prototype = Object.create(THREE.Object3D.prototype);

/**
 * Allows to link the entity with a scene or entity.
 * @param  {Base} Parent Should always be a scene.
 * @return {undefined}
 */
Entity.prototype.setScene = function(scene) {
    if (scene) {

        // Register the entity in the scene.
        scene.entities[this.key] = this;

        // Asking the children to set their scene.
        for (var key in this.children) {
            if (this.children[key].setScene instanceof Function) {
                this.children[key].setScene(scene);
            }
        }

        // Setting the scene pointer.
        this.scene = scene;
    }
};

Entity.prototype.setGame = function(game) {
    if (game) {

        // Asking the children to set their scene.
        for (var key in this.children) {
            if (this.children[key].setGame instanceof Function) {
                this.children[key].setGame(game);
            }
        }

        // Setting the scene pointer.
        this.game = game;
    }
};

Entity.prototype.add = function(object) {

    // Declaring.
    var that = this;

    // Setting the object's entity.
    if (object.setEntity instanceof Function) {
        object.setEntity(this);
    }

    // Setting the object's scene.
    if (object.setScene instanceof Function) {
        object.setScene(this.scene);
    }

    // Setting the object's scene.
    if (object.setGame instanceof Function) {
        object.setGame(this.game);
    }

    // This is an optimization to make sure all other object don't update their matrix.
    if (!(object instanceof Entity) && object.updateMatrix) {
        object.matrixAutoUpdate = false;
        object.updateMatrix();
    }

    // If the object has a load function we load it and add it on callback.
    if (object.load instanceof Function) {
        object.load(function() {
            THREE.Object3D.prototype.add.call(that, object);
        });

        // We just add the object to the scene calling super.
    } else {
        THREE.Object3D.prototype.add.call(this, object);
    }
};

/**
 * Updates the entity.
 */
Entity.prototype.update = function() {
    var key;

    // Updating actions.
    for (key in this.actions) {
        this.actions[key].update();
    }

    // Storing position before any change happens.
    var worldPosition = this.buffer.zeroVector.clone().getPositionFromMatrix(this.matrixWorld);
    this.buffer.positionWorld.set(worldPosition.x, worldPosition.y, worldPosition.z);

    // Launching custom pre-update.
    this.onPreUpdate();

    if (this.dynamic) {

        // Computing acceleration.
        this.acceleration.x += this.force.x / this.mass;
        this.acceleration.y += this.force.y / this.mass;
        this.acceleration.z += this.force.z / this.mass;

        // Applying gravity and acceleration.
        this.velocity.add(this.scene.gravity);
        this.velocity.add(this.acceleration.multiplyScalar(this.cof));

        // Calculating displacement.
        this.displacement.add(this.velocity);
        this.displacement.multiplyScalar(this.scene.game.delta);

        // Getting the world position of the entity.
        this.position.add(this.displacement);
        this.updateMatrixWorld();

        // Resetting stuff for next round.
        this.cof = 0;
        this.collisions = [];
        this.friction.set(0, 0, 0);
        this.normalForce.set(0, 0, 0);
        this.bounceForce.set(0, 0, 0);

        // Solving collisions for given displacement.
        this.handleCollisions();

        // If any collision happened.
        if (this.collisions.length) {

            // No collisions were detected. Applying normal force and friction.
            this.velocity.add(this.normalForce);
            this.velocity.add(this.friction);
            this.velocity.add(this.bounceForce);

            // Treating custom collision handling.
            this.onCollision();
        }

        // Calculating and applying drag force also called air resistance.
        this.dragForce = this.velocity.clone().multiplyScalar(-this.scene.drag);
        this.velocity.add(this.dragForce);
        this.cof = this.scene.drag > this.cof ? this.scene.drag : this.cof;

    } else {

        // For non dynamic object we provide this flag to force the matrix update.
        if (this.buffer.updateStatic) {
            this.updateMatrix();
            this.buffer.updateStatic = false;
        }
    }

    // Launch custom post-update.
    this.onPostUpdate();

    // Updating the children.
    for (key in this.children) {
        if (this.children[key].update instanceof Function) {
            this.children[key].update();
        }
    }
};

/**
 * Reset values.
 */
Entity.prototype.reset = function() {
    if (this.dynamic) {
        this.displacement.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.force.set(0,0,0);
    }
};

/**
 * Affects the position and velocity off the entity based on detected collisions.
 * @param {Vector3} position
 */
Entity.prototype.handleCollisions = function() {

    // For each colliders emitting.
    for (var collider in this.colliders) {

        if (this.colliders[collider].receive) {

            // For each vertex in the collider.
            for (var id in this.colliders[collider].geometry.vertices) {

                // Creating a raycaster that goes from the entitie's current world position to the detector vertex's next position.
                var vertex = this.colliders[collider].geometry.vertices[id];
                var vertexNextPositionWorld = vertex.clone().applyMatrix4(this.colliders[collider].matrixWorld);

                var ray = vertexNextPositionWorld.clone().sub(this.buffer.positionWorld);
                this.buffer.raycaster.far = ray.length() - 0.0001;
                this.buffer.raycaster.set(this.buffer.positionWorld, ray);

                // Use that raycaster to detect collisions with registered scene colliders.
                var collisions = this.buffer.raycaster.intersectObjects(this.scene.colliders);

                // For each collision encountered on this ray.
                for (var key in collisions) {

                    // Skipping if intersecting itself.
                    if (collisions[key].object.entity !== this) {

                        // Getting the normal of the colliding face in the world context.
                        var collisionNormal = collisions[key].face.normal.clone().applyMatrix4(collisions[key].object.matrixWorld);
                        collisionNormal.sub(this.buffer.zeroVector.clone().getPositionFromMatrix(collisions[key].object.matrixWorld));

                        // Determining the necessary correction.
                        var overlap = collisions[key].point.clone().sub(vertexNextPositionWorld);
                        var correctiveVector = collisionNormal.clone().multiplyScalar(overlap.dot(collisionNormal));
                        correctiveVector.applyMatrix4(new THREE.Matrix4().getInverse(this.matrixWorld.clone().setPosition(this.buffer.zeroVector)));

                        // Correcting the displacement.
                        this.position.add(correctiveVector);
                        this.updateMatrixWorld();

                        // Calculating normal force.
                        var dot = this.velocity.dot(collisionNormal);
                        var perpendicularForce = collisionNormal.clone().multiplyScalar(dot);
                        this.normalForce.add(perpendicularForce.clone().multiplyScalar(-1));

                        // Calculating friction.
                        var cof = collisions[key].object.parent.roughness;
                        this.friction.add(perpendicularForce.clone().sub(this.velocity).multiplyScalar(cof));
                        this.cof = cof > this.cof ? cof : this.cof;

                        // Calculating bounce force.
                        var cob = collisions[key].object.parent.elasticity;
                        this.bounceForce.add(perpendicularForce.clone().multiplyScalar(-cob));

                        // Let's recurse to re-assess the situation.
                        this.collisions.push(collisions[key]);

                        // Let's recurse.
                        this.handleCollisions();
                        return;
                    }
                }
            }
        }
    }
};

module.exports = Entity;