// Imports.
var THREE = require('three');

/**
 * The misc object holds a collection of useful static methods.
 * @type {Object}
 */
var Misc = {

    /**
     * Returns a random color.
     * @returns {Number} A random hexadecimal color.
     */
    getRandomColor: function() {
        "use strict";
        return Math.floor(Math.random() * 16777215);
    },

    /**
     * Returns a THREE.ShaderMaterial and applies requested external shaders to it when ready.
     * @param  {String} vertexShaderURL URL of the vertex shader.
     * @param  {String} fragmentShaderURL URL of the fragment shader.
     * @param  {THREE.ShaderMaterial} uniforms Your own uniforms.
     * @return {THREE.ShaderMaterial} A material with vertex and fragment shader from URLs.
     */
    getShaderMaterial: function(vertexShaderURL, fragmentShaderURL, uniforms) {
        uniforms = uniforms ? uniforms : {};
        shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: "void main() {gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}",
            fragmentShader: "void main() {gl_FragColor = vec4(0, 0, 0, 0);}"
        });

        if (vertexShaderURL) {
            var vertexRequest = new XMLHttpRequest();
            vertexRequest.open('GET', vertexShaderURL);

            vertexRequest.onload = function() {
                shaderMaterial.vertexShader = this.responseText;
                if (fragmentShaderURL) {
                    var fragmentRequest = new XMLHttpRequest();
                    fragmentRequest.open('GET', fragmentShaderURL);

                    fragmentRequest.onload = function() {
                        shaderMaterial.fragmentShader = this.responseText;
                        shaderMaterial.needsUpdate = true;
                    };
                    fragmentRequest.send();
                }
            };
            vertexRequest.send();
        }
        return shaderMaterial;
    },

    getURLParameters: function(url) {
        var key, numver, hash, parameters = {};
        url = url ? url : window.location.href;
        questionMarkIndex = url.indexOf('?');
        if (questionMarkIndex >= 0) {
            var hashes = url.slice(questionMarkIndex + 1).split('&');
            for (key in hashes) {
                if (hashes[key].indexOf('=') >= 0) {
                    hash = hashes[key].split('=');
                    number = parseFloat(hash[1]);
                    parameters[hash[0]] = isNaN(number) ? hash[1] : number;
                }
            }
        }
        return parameters;
    },

    getJSON: function(url, callback) {
        console.warn('Misc.getJSON is a deprecated method. Use Loader.get instead');
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.onload = function() {
            var json = JSON.parse(this.responseText);
            if (callback) {
                callback(json);
            }
        };
        request.send();
    }
};

// Exports.
module.exports = Misc;