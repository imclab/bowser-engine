// Imports.
var THREE = require('three');

/**
 * Initializes the monitor object. GUI object to monitor game properties.
 * Each property takes the form of a output object.
 * @constructor
 * @returns {Monitor}
 */
var Monitor = function(game) {
	this.game = game;

	// Creating the monitor div.
	this.div = document.createElement('div');
	this.div.className = 'monitor';
	this.div.style.width = '280px';
	this.div.style.fontWeight = 'bold';
	this.div.style.position = 'absolute';
	this.div.style.top = '0px';
	this.div.style.left = '0px';
	this.div.style.margin = '15px';
	this.div.style.padding = '15px';
	this.div.style.backgroundColor = 'rgba(0,0,0,0.5)';
	this.div.style.color = '#c0c0c0';
	this.div.style.borderRadius = '3px';
	this.div.style.fontFamily = 'Inconsolata, Sans-Serif';
	this.div.style.fontSize = '14px';
	this.div.innerHTML = '<div style="margin-bottom: 8px; color:white; font-size:22px;">' + this.game.key.toUpperCase() + '</div>';

	this.visible = false;
	this.items = {};

	// Adding default outputs.
	var that = this;

	this.addOutput('Frame Rate', this.game, 'fps');
};

/**
 * Shows the monitor's div my attaching it to the DOM. Needs the DOM.
 * @return {undefined}
 */
Monitor.prototype.show = function() {
	this.visible = true;
	this.game.div.appendChild(this.div);
};

/**
 * Hides the monitor's div and makes sure the value do not get updated anymore.
 * @return {undefined}
 */
Monitor.prototype.hide = function() {
	if(this.visible) {
		this.game.div.removeChild(this.div);
		this.visible = false;
	}
};

/**
 * Updates the avalaible outputs' values.
 * @return {undefined}
 */
Monitor.prototype.update = function() {
	var name, item, div;

	if(this.visible) {
		for(name in this.items) {
			item = this.items[name];

			// If the item is of type output we just set the inner html.
			if(item.type === 'output') {
				div = item.div.innerText = ['>', [name, ':'].join(''), item.getter()].join(' ');

			// If it's an input output we set the input element.
			} else if (item.type === 'input') {

				// Setting the input value only when not in focus.
				if (item.input !== document.activeElement) {
					item.input.value = item.getter();
				}
			}
		}
	}
};

/**
 * Adds a output to the monitor.
 */
Monitor.prototype.addOutput = function(name, pointer, property, decimals) {
	var div;

	decimals = decimals ? decimals : 0;

	var getter = function() {
		if (property) {
			var value = pointer[property];
			number = parseFloat(value).toFixed(decimals);
			return number === "NaN" ? value : number;
		} else if (pointer instanceof THREE.Vector3) {
			return [pointer.x.toFixed(decimals), pointer.y.toFixed(decimals), pointer.z.toFixed(decimals)].join(' ');
		} else {
			return '';
		}
	};

	if(!(name in this.items)) {
		div = document.createElement('div');
		div.innerText = ['>', [name, ':'].join(''), getter()].join(' ');
		this.div.appendChild(div);
	}

	// Storing the item.
	this.items[name] = {
		type: 'output',
		div: div ? div : this.items[name].div,
		getter: getter
	};
};

/**
 * Adds a input to the monitor that also allows input.
 */
Monitor.prototype.addInput = function(name, pointer, property, decimals) {
	var that = this;
	var div, input;

	decimals = decimals ? decimals : 0;

	var getter = function() {
		var value = pointer[property];
		number = parseFloat(value).toFixed(decimals);
		return number === "NaN" ? value : number;
	};

	var setter = function() {
		var value = input.value;
		var number = parseFloat(value).toFixed(decimals);
		pointer[property] = number === "NaN" ? value : number;

		// The value was applied, make sure the display is updated. If 10 is typed in it should display 10.00.
		input.value = getter();
	};

	if(!(name in this.items)) {

		// Creating the item div.
		div = document.createElement('div');
		div.innerText = ['>', [name, ': '].join('')].join(' ');

		// Creating the text input.
		input = document.createElement('input');
		input.value = getter();
		input.style.background = 'rgba(0,0,0,0)';
		input.style.border = '0px';
		input.style.padding = '0px';
		input.style.margin = '0px';
		input.style.width = '50px';
		input.style.height = '14px';
		input.style.color = 'white';
		input.style.fontWeight = 'bold';
		input.style.fontFamily = 'Inconsolata, Sans-Serif';
		input.style.fontSize = '14px';

		// Create the handler for the input.
		input.addEventListener('change', setter);

		// Happening all that to the monitor's div.
		div.appendChild(input);
		this.div.appendChild(div);
	}

	// Storing the item.
	this.items[name] = {
		type: 'inputOutput',
		div: div ? div : this.items[name].div,
		input: input ? input : this.items[name].input,
		setter: setter,
		getter: getter
	};
};

/**
 * Removes the output from the monitor.
 * @param  {String} name The output's name.
 * @return {undefined}
 */
Monitor.prototype.removeItem = function(name) {
	this.div.removeChild(this.items[name].div);
	delete(this.items[name]);
};

// Exports.
module.exports = Monitor;
