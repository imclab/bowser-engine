// Library imports.
var THREE = require('three');
var WATCHJS = require('watchjs');

// Class imports.
var Sampler = require('./sampler');
var Base = require('./base');
var Keyboard = require('./keyboard');
var Mouse = require('./mouse');
var Composer = require('./composer');
var Scene = require('./scene');
var Loader = require('./loader');
var Resolution = require('./resolution');
var Monitor = require('./monitor');
var Scene3D = require('./3d/scene');
var Scene2D = require('./2d/scene');

/**
 * Initializes the game object.
 * @constructor
 */
var Game = function(parameters) {

	// Defining variables.
	var key, that = this;

	// Calling super
	Base.call(this);

	// Adding stuff to the head of the page.
	var link = document.createElement('link');
	link.href = 'http://fonts.googleapis.com/css?family=Inconsolata:400,700';
	link.rel = 'stylesheet';
	link.type = 'text/css';
	document.head.appendChild(link);

	// Initializing parameters.
	parameters = parameters ? parameters : {};
	this.modal = parameters.modal ? parameters.modal : false;
	this.key = parameters.key ? parameters.key : 'game';

	// Creating the game div.
	this.div = document.createElement('div');
	this.div.id = this.key;
	this.div.className = 'game';
	this.div.style.position = 'relative';
	this.div.style.width = '100%';
	this.div.style.height = '100%';
	this.div.style.margin = 'auto';

	// Initializing properties.
	this.renderer = new THREE.WebGLRenderer();
	this.scenes = {};
	this.sampler = new Sampler(this);
	this.keyboard = new Keyboard(this);
	this.mouse = new Mouse(this);
	this.monitor = new Monitor(this);
	this.handlers = {};
	this.debug = false;
	this.fullscreen = false;
	this.canvas = this.renderer.domElement;
	this.clock = new THREE.Clock(false);
	this.composer = new Composer(this);
	this.fps = 0;
	this.frame = 0;
	this.delta = 0;

	// Setting up the game canvas.
	this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
	this.canvas.setAttribute('tabindex', 1);
	this.canvas.style.outline = 'none';

	// Setting up the div.
	this.div.appendChild(this.canvas);

	// Setting up the renderer.
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
	this.renderer.autoClear = false;

	// Adding watchers.
	WATCHJS.watch(that, 'visible', function() {
		if (that.visible) {
			that.show();
		} else {
			that.hide();
		}
	});

	WATCHJS.watch(that, 'clearColor', function() {
		that.renderer.setClearColor(that.clearColor, 1);
	});

	// Initializing parameters.
	this.clearColor = parameters.clearColor !== undefined ? parameters.clearColor : 0x0432ff;
	this.resolution = parameters.resolution ? parameters.resolution : new Resolution();

	// Adding Additional Watchers.
	WATCHJS.watch(that, "resolution", function() {
		that.onResize();
	});

	// Adding provided scenes.
	var scenes = parameters.scenes ? parameters.scenes : [];
	for (key in scenes) {
		this.add(scenes[key]);
	}

	// Adding extra passes.
	var passes = parameters.passes ? parameters.passes : [];
	for (key in passes) {
		this.composer.add(passes[key]);
	}
};

Game.prototype = Object.create(Base.prototype);

Game.prototype.start = function(container, debug) {
	this.debug = debug ? debug : false;
	this.container = container;
	if (!this.debug) {
		this.run();
	}
	this.visible = true;
};

Game.prototype.run = function() {
	this.clock.start();
	this.looping = true;
	this.loop();
};

Game.prototype.stop = function() {
	this.clock.stop();
	this.looping = false;
};

Game.prototype.pause = function() {
	this.stop();
};

Game.prototype.resume = function() {
	this.run();
};

Game.prototype.increment = function() {
	if (!this.looping) {
		this.clock.start();
		this.update();
		this.clock.stop();
	}
};

/**
 * Loops indefinatly through the update and render methods.
 * @method
 * @returns {undefined}
 */
Game.prototype.loop = function() {
	if (this.looping) {
		this.update();
		var that = this;
		requestAnimationFrame(function() {
			that.loop();
		});
	}
};

/**
 * Shows the game div by attaching it to a DOM element container. DOM needs to be ready.
 * @method
 * @param {Element} container The DOM element where the game will run.
 * @returns {undefined}
 */
Game.prototype.show = function() {

	// If container is defined and the game div is not already attached to the DOM.
	if (this.container && !this.div.parentElement) {
		this.container.appendChild(this.div);
		this.connectHandlers();
		this.onResize();
		this.focus();
	}
};

/**
 * Hides the game by detaching the game div from the DOM.
 * @method
 * @returns {undefined}
 */
Game.prototype.hide = function() {

	// If the game div is attached to the DOM.
	if (this.div.parentElement) {
		this.disconnectHandlers();
		this.container.removeChild(this.div);
	}
};

/**
 * Updates the scene keyboard and scene.
 * @method
 * @returns {undefined}
 */
Game.prototype.update = function() {

	// Updating some properties.
	this.frame += 1;
	this.delta = this.clock.getDelta();

	// Updating the keyboard.
	this.keyboard.update();

	// Updating the sampler.
	this.sampler.update();

	// Updating all active scenes.
	for (var key in this.scenes) {
		this.scenes[key].update();
	}

	// Optimising the update of certain things:
	if (this.frame % 4 === 0) {
		this.fps = Math.floor(1 / this.delta);
		this.monitor.update();
	}

	// Rendering.
	this.render();
};

/**
 * Renders the game.
 * @method
 * @returns {undefined}
 */
Game.prototype.render = function() {
	this.composer.render();
};

/**
 * Connects canvas events to the game logic.
 * @method
 * @returns {undefined}
 */
Game.prototype.connectHandlers = function() {
	var that = this;

	this.handlers.windowSizeChange = function(event) {
		that.onResize();
	};

	this.handlers.documentFullScreenChange = function(event) {
		that.onResize();
	};

	this.handlers.mouseLockChange = function(event) {
		that.mouse.locked = !that.mouse.locked;
	};

	this.handlers.canvasFocusChange = function(event) {
		if (event.type === 'focus') {
			that.onFocus();
		} else {
			that.onBlur();
		}
	};

	this.handlers.mousePositionChange = function(event) {
		that.mouse.setPosition(event);
	};

	this.handlers.mouseButtonChange = function(event) {
		if (that.modal && !that.mouse.locked) {
			that.canvas.requestPointerLock();
		}
		that.mouse.setButtonState(event);
	};

	this.handlers.keyboardKeyChange = function(event) {

		// Catch for fullscreen key combination. I am forcing that on people sorry.
		if (document.webkitFullscreenEnabled) {
			if (event.type === 'keydown' && event.altKey && event.keyCode === 70) {
				if (document.webkitIsFullScreen) {
					document.webkitExitFullscreen();
				} else {
					that.div.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
				}
			}
		}

		// Setting the key state based on the event for other custom use.
		that.keyboard.setKeyState(event);
	};

	window.addEventListener('resize', this.handlers.windowSizeChange);

	document.addEventListener('webkitfullscreenchange', this.handlers.documentFullScreenChange);
	document.addEventListener('pointerlockchange', this.handlers.mouseLockChange);
	document.addEventListener('mozpointerlockchange', this.handlers.mouseLockChange);
	document.addEventListener('webkitpointerlockchange', this.handlers.mouseLockChange);

	this.canvas.addEventListener('keydown', this.handlers.keyboardKeyChange);
	this.canvas.addEventListener('keyup', this.handlers.keyboardKeyChange);
	this.canvas.addEventListener('mousemove', this.handlers.mousePositionChange);
	this.canvas.addEventListener('mousedown', this.handlers.mouseButtonChange);
	this.canvas.addEventListener('mouseup', this.handlers.mouseButtonChange);
	this.canvas.addEventListener('blur', this.handlers.canvasFocusChange);
	this.canvas.addEventListener('focus', this.handlers.canvasFocusChange);
};

/**
 * Disconnects canvas events to the game logic.
 * @method
 * @return {undefined}
 */
Game.prototype.disconnectHandlers = function() {
	window.removeEventListener('resize', this.handlers.windowResize);

	document.removeEventListener('webkitfullscreenchange', this.handlers.documentFullScreen);
	document.removeEventListener('pointerlockchange', this.handlers.mouseLockChange);
	document.removeEventListener('mozpointerlockchange', this.handlers.mouseLockChange);
	document.removeEventListener('webkitpointerlockchange', this.handlers.mouseLockChange);

	this.canvas.removeEventListener('keydown', this.handlers.keyboardKeyChange);
	this.canvas.removeEventListener('keyup', this.handlers.keyboardKeyChange);
	this.canvas.removeEventListener('mousemove', this.handlers.mousePositionChange);
	this.canvas.removeEventListener('mousedown', this.handlers.mouseButtonChange);
	this.canvas.removeEventListener('mouseup', this.handlers.mouseButtonChange);
	this.canvas.removeEventListener('blur', this.handlers.canvasFocusChange);
	this.canvas.removeEventListener('focus', this.handlers.canvasFocusChange);
};

/**
 * Updates the rendererer resolution to the provided size as well as various cameras.
 * @method
 * @returns {undefined}
 */
Game.prototype.onResize = function() {
	if (this.visible) {
		var key;
		var containerResolution = new Resolution({
			width: this.container.offsetWidth,
			height: this.container.offsetHeight
		});

		if (this.resolution.isValid()) {

			var divResolution = new Resolution();
			var imageRatio = this.resolution.getImageRatio();

			if (this.resolution.adaptive || this.resolution.stretch) {
				if (containerResolution.getImageRatio() > imageRatio) {
					divResolution.width = containerResolution.height * imageRatio;
					divResolution.height = containerResolution.height;
					this.div.style.width = divResolution.width.toString() + 'px';
					this.div.style.height = '100%';
					this.div.style.top = '0';
				} else {
					divResolution.width = containerResolution.width;
					divResolution.height = containerResolution.width / imageRatio;
					this.div.style.width = '100%';
					this.div.style.height = divResolution.height.toString() + 'px';
					if (document.webkitIsFullScreen) {
						this.div.style.top = '0';
					} else {
						this.div.style.top = Math.round((containerResolution.height - divResolution.height) / 2);
					}
				}
			} else {
				divResolution.width = this.resolution.width;
				divResolution.height = this.resolution.height;
				this.div.style.width = divResolution.width.toString() + 'px';
				this.div.style.height = divResolution.height.toString() + 'px';
				this.div.style.top = Math.round((containerResolution.height - divResolution.height) / 2).toString() + 'px';
			}

			this.renderer.setSize(divResolution.width, divResolution.height);

			for (key in this.scenes) {
				if (this.scenes[key] instanceof Scene3D) {
					this.scenes[key].setResolution(divResolution.width, divResolution.height);
				} else if (this.scenes[key] instanceof Scene2D) {
					this.scenes[key].setResolution(this.resolution.width, this.resolution.height);
				}
			}

			if (this.resolution.adaptive) {
				this.composer.setResolution(divResolution.width, divResolution.height);
			} else {
				this.composer.setResolution(this.resolution.width, this.resolution.height);
			}

		} else {

			// We set the resolution of everything to match the container's resolution.
			this.div.style.top = '0';
			this.div.style.width = '100%';
			this.div.style.height = '100%';
			this.renderer.setSize(containerResolution.width, containerResolution.height);

			for (key in this.scenes) {
				this.scenes[key].setResolution(containerResolution.width, containerResolution.height);
			}
			this.composer.setResolution(containerResolution.width, containerResolution.height);
		}
	}
};

/**
 * Adds objects to the scene. Currently support scene objects.
 */
Game.prototype.add = function(object) {
	if (object.setGame instanceof Function) {
		object.setGame(this);
    }
};

/**
 * Set focus on the canvas.
 * @method
 * @returns {undefined}
 */
Game.prototype.focus = function() {
	this.canvas.focus();
	this.onFocus();
};

/**
 * Triggered when the focus is set on the canvas.
 * @return {[type]} [description]
 */
Game.prototype.onFocus = function() {};

/**
 * Triggered when the canvas looses focus.
 * @return {[type]} [description]
 */
Game.prototype.onBlur = function() {};

/**
 * Logs message only in when debug mode is true.
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
Game.prototype.log = function(message) {
	if (this.debug) {
		console.log(message);
	}
};

// Exports.
module.exports = Game;