// Imports.
var THREE = require('three');
var WATCHJS = require('watchjs');
var Sampler = require('./sampler');
var Keyboard = require('./keyboard');
var Mouse = require('./mouse');
var Composer = require('./composer');
var Scene = require('./scene');
var Resolution = require('./resolution');
var Monitor = require('./monitor');
var Scene3D = require('./3d/scene');
var Scene2D = require('./2d/scene');

/**
 * Initializes the game object.
 * @constructor
 */
var That = function(parameters) {
	var that = this;

	// Adding stuff to the head of the page.
	var link = document.createElement('link');
	link.href = 'http://fonts.googleapis.com/css?family=Inconsolata:400,700';
	link.rel = 'stylesheet';
	link.type = 'text/css';
	document.head.appendChild(link);

	// Initializing parameters.
	parameters = parameters ? parameters : {};
	this.name = parameters.name ? parameters.name : 'game';

	// Creating the game div.
	this.div = document.createElement('div');
	this.div.id = this.name;
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
	this.canvas.setAttribute('tabindex', 1);
	this.canvas.style.outline = 'none';

	// Setting up the div.
	this.div.appendChild(this.canvas);

	// Setting up the renderer.
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = true;
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
		that.renderer.setClearColorHex(that.clearColor, 1);
	});

	// Creating the events object.
	this.events = parameters.events !== undefined ? parameters.events : {};
	this.events.onBlur = this.events.onBlur ? this.events.onBlur : function() {};
	this.events.onFocus = this.events.onFocus ? this.events.onFocus : function() {};
	this.events.onResize = this.events.onResize ? this.events.onResize : function() {};
	this.events.onPause = this.events.onPause ? this.events.onPause : function() {
		this.stop();
	};
	this.events.onResume = this.events.onResume ? this.events.onResume : function() {
		this.run();
	};

	// Initializing parameters.
	this.clearColor = parameters.clearColor ? parameters.clearColor : 0x000000;
	this.resolution = parameters.resolution ? parameters.resolution : new Resolution();

	// Adding Additional Watchers.
	WATCHJS.watch(that, "resolution", function() {
		that.updateResolution();
		that.events.onResize();
	});

	// Adding provided scenes.
	var scenes = parameters.scenes ? parameters.scenes : [];
	for (var key in parameters.scenes) {
		this.add(scenes[key]);
	}
};

That.prototype.start = function(container, debug) {
	this.debug = debug ? debug : false;
	this.container = container;
	if (!this.debug) {
		this.run();
	}
	this.visible = true;
};

That.prototype.run = function() {
	this.clock.start();
	this.looping = true;
	this.loop();
};

That.prototype.stop = function() {
	this.clock.stop();
	this.looping = false;
};

That.prototype.pause = function() {
	this.onPause();
};

That.prototype.resume = function() {
	this.onResume();
};

That.prototype.increment = function() {
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
That.prototype.loop = function() {
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
That.prototype.show = function() {

	// If container is defined and the game div is not already attached to the DOM.
	if (this.container && !this.div.parentElement) {
		this.container.appendChild(this.div);
		this.connectHandlers();
		this.updateResolution();
		this.focus();
	}
};

/**
 * Hides the game by detaching the game div from the DOM.
 * @method
 * @returns {undefined}
 */
That.prototype.hide = function() {

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
That.prototype.update = function() {

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
That.prototype.render = function() {
	this.composer.render();
};

/**
 * Connects canvas events to the game logic.
 * @method
 * @returns {undefined}
 */
That.prototype.connectHandlers = function() {
	var that = this;

	this.handlers.windowResize = function(event) {
		that.updateResolution();
		that.events.onResize();
	};

	this.handlers.documentFullScreen = function(event) {
		that.updateResolution();
		that.events.onResize();
	};

	this.handlers.canvasBlur = function(event) {
		that.events.onBlur();
	};

	this.handlers.canvasFocus = function(event) {
		that.events.onFocus();
	};

	this.handlers.mouseMove = function(event) {
		that.mouse.setPosition(event);
	};

	this.handlers.mouseButtonChange = function(event) {
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

	window.addEventListener('resize', this.handlers.windowResize);
	document.addEventListener('webkitfullscreenchange', this.handlers.documentFullScreen);
	this.canvas.addEventListener('keydown', this.handlers.keyboardKeyChange);
	this.canvas.addEventListener('keyup', this.handlers.keyboardKeyChange);
	this.canvas.addEventListener('mousemove', this.handlers.mouseMove);
	this.canvas.addEventListener('mousedown', this.handlers.mouseButtonChange);
	this.canvas.addEventListener('mouseup', this.handlers.mouseButtonChange);
	this.canvas.addEventListener('blur', this.handlers.canvasBlur);
	this.canvas.addEventListener('focus', this.handlers.canvasFocus);
};

/**
 * Disconnects canvas events to the game logic.
 * @method
 * @return {undefined}
 */
That.prototype.disconnectHandlers = function() {
	window.removeEventListener('resize', this.handlers.windowResize);
	document.removeEventListener('webkitfullscreenchange', this.handlers.documentFullScreen);
	this.canvas.removeEventListener('keydown', this.handlers.keyboardKeyChange);
	this.canvas.removeEventListener('keyup', this.handlers.keyboardKeyChange);
	this.canvas.addEventListener('mousemove', this.handlers.mouseMove);
	this.canvas.addEventListener('mousedown', this.handlers.mouseButtonChange);
	this.canvas.addEventListener('mouseup', this.handlers.mouseButtonChange);
	this.canvas.removeEventListener('blur', this.handlers.blur);
	this.canvas.removeEventListener('focus', this.handlers.canvasFocus);
};

/**
 * Updates the rendererer resolution to the provided size as well as various cameras.
 * @method
 * @returns {undefined}
 */
That.prototype.updateResolution = function() {
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
					this.div.style.top = '0px';
				} else {
					divResolution.width = containerResolution.width;
					divResolution.height = containerResolution.width / imageRatio;
					this.div.style.width = '100%';
					this.div.style.height = divResolution.height.toString() + 'px';
					if (document.webkitIsFullScreen) {
						this.div.style.top = '0px';
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
			this.div.style.top = '0px';
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
 * @method
 * @param {Object} The object to be added to the game.
 */
That.prototype.add = function(object) {
	object.game = this;

	if (object instanceof Scene) {
		this.scenes[object.key] = object;
		this.composer.add(object.pass);
	}
	return object;
};

/**
 * Focuses on the canvas element.
 * @method
 * @returns {undefined}
 */
That.prototype.focus = function() {
	this.canvas.focus();
};

That.prototype.log = function(message) {
	if (this.debug) {
		console.log(message);
	}
};

// Exports.
module.exports = That;