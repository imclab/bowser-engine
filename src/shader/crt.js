// Imports.
var THREE = require('three');

/**
 * Shader that reproduce the effect of an old CRT monitor.
 * @param {Number} width
 * @param {Number} height
 */
var CRTShader = function(parameters) {

    // Calling super.
    THREE.ShaderMaterial.call(this, parameters);

    //  Initializing properties.
    var textureSize = null;

    // Handling parameters.
    parameters = parameters ? parameters : {};

    if (parameters.width && parameters.height) {
        textureSize = new THREE.Vector2(parameters.width, parameters.height);
    }

    this.uniforms = {
        'texture': {
            type: 't',
            value: null
        },
        'textureSize': {
            type: 'v2',
            value: textureSize
        },
        'darkness': {
            type: 'f',
            value: 1.0
        },
        'offset': {
            type: 'f',
            value: 1.0
        }
    };

    this.vertexShader = [
        '/*  CRT Shader',
        ' *',
        ' *  Copyright (C) 2012-2013 Douglas Lassance',
        ' *  Port of the amazing work of cgwg, Themaister and DOLLS.',
        ' *',
        ' *  This program is free software; you can redistribute it and/or modify it',
        ' *  under the terms of the GNU General Public License as published by the Free',
        ' *  Software Foundation; either version 2 of the License, or (at your option)',
        ' *  any later version.',
        ' */',

        'uniform vec2 textureSize;',

        'varying float CRTgamma;',
        'varying float monitorgamma;',
        'varying vec2 overscan;',
        'varying vec2 aspect;',
        'varying float d;',
        'varying float R;',
        'varying float borderRadius;',
        'varying float borderSharpness;',
        'varying vec3 stretch;',
        'varying vec2 sinangle;',
        'varying vec2 cosangle;',
        'varying vec2 uvs;',
        'varying vec2 one;',

        '#define FIX(c) max(abs(c), 1e-5);',

        'float intersect(vec2 xy) {',
            'float A = dot(xy,xy)+d*d;',
            'float B = 2.0*(R*(dot(xy,sinangle)-d*cosangle.x*cosangle.y)-d*d);',
            'float C = d*d + 2.0*R*d*cosangle.x*cosangle.y;',
            'return (-B-sqrt(B*B-4.0*A*C))/(2.0*A);',
        '}',

        'vec2 bkwtrans(vec2 xy) {',
            'float c = intersect(xy);',
            'vec2 point = vec2(c)*xy;',
            'point -= vec2(-R)*sinangle;',
            'point /= vec2(R);',
            'vec2 tang = sinangle/cosangle;',
            'vec2 poc = point/cosangle;',
            'float A = dot(tang,tang)+1.0;',
            'float B = -2.0*dot(poc,tang);',
            'float C = dot(poc,poc)-1.0;',
            'float a = (-B+sqrt(B*B-4.0*A*C))/(2.0*A);',
            'vec2 uv = (point-a*sinangle)/cosangle;',
            'float r = R*acos(a);',
            'return uv*r/sin(r/R);',
        '}',

        'vec2 fwtrans(vec2 uv) {',
            'float r = FIX(sqrt(dot(uv,uv)));',
            'uv *= sin(r/R)/r;',
            'float x = 1.0-cos(r/R);',
            'float D = d/R + x*cosangle.x*cosangle.y+dot(uv,sinangle);',
            'return d*(uv*cosangle-x*sinangle)/D;',
        '}',

        'vec3 maxscale() {',
            'vec2 c = bkwtrans(-R * sinangle / (1.0 + R/d*cosangle.x*cosangle.y));',
            'vec2 a = vec2(0.5,0.5)*aspect;',
            'vec2 lo = vec2(fwtrans(vec2(-a.x,c.y)).x, fwtrans(vec2(c.x,-a.y)).y)/aspect;',
            'vec2 hi = vec2(fwtrans(vec2(+a.x,c.y)).x, fwtrans(vec2(c.x,+a.y)).y)/aspect;',
            'return vec3((hi+lo)*aspect*0.5,max(hi.x-lo.x,hi.y-lo.y));',
        '}',

        'void main() {',

            '// Gamma of simulated CRT',
            'CRTgamma = 2.4;',

            '// Gamma of display monitor. Typically 2.2 is correct.',
            'monitorgamma = 2.2;',

            '// Overscan amount. 1.02 for 2 percents.',
            'overscan = vec2(1.00,1.00);',

            '// Aspect ratio.',
            'aspect = vec2(1.0, 1.0);',

            '// Lengths are measured in units of (approximately) the width of the monitor simulated distance from viewer to monitor.',
            'd = 2.0;',

            '// Radius of curvature',
            'R = 4.0;',

            '// Tilt angle in radians. Behavior might be a bit wrong if both components are non-zero.',
            'const vec2 angle = vec2(0.0,0.0);',

            '// Size of the round corners.',
            'borderRadius = 0.01;',

            '// Decrease if borders are too aliased.',
            'borderSharpness = 250.0;',

            '// Do the standard vertex processing.',
            'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',

            '// Precalculate a bunch of useful values we will need in the fragment shader.',
            'sinangle = sin(angle);',
            'cosangle = cos(angle);',
            'stretch = maxscale();',

            '// Texture coords.',
            'uvs = uv;',

            '// The size of one texel in texture-coordinates.',
            'one = 1.0 / textureSize;',
        '}'
    ].join('\n');

    this.fragmentShader = [
        '/*  CRT shader',
        ' *',
        ' *  Copyright (C) 2012-2013 Douglas Lassance',
        ' *  Port of the amazing work of cgwg, Themaister and DOLLS.',
        ' *',
        ' *  This program is free software; you can redistribute it and/or modify it',
        ' *  under the terms of the GNU General Public License as published by the Free',
        ' *  Software Foundation; either version 2 of the License, or (at your option)',
        ' *  any later version.',
        ' */',

        'uniform sampler2D texture;',
        'uniform vec2 textureSize;',

        'varying vec2 uvs;',
        'varying vec2 one;',
        'varying float CRTgamma;',
        'varying float monitorgamma;',
        'varying vec2 overscan;',
        'varying vec2 aspect;',
        'varying float d;',
        'varying float R;',
        'varying float borderRadius;',
        'varying float borderSharpness;',
        'varying vec3 stretch;',
        'varying vec2 sinangle;',
        'varying vec2 cosangle;',

        '// Enable interpolation in linear gamma and loose speed.',
        '// #define LINEAR_PROCESSING',

        '// Enable screen curvature.',
        '#define CURVATURE',

        '// Enable 3x oversampling of the beam profile.',
        '// #define OVERSAMPLE',

        '// Macros.',
        '#define FIX(c) max(abs(c), 1e-5);',
        '#define PI 3.141592653589',

        '#ifdef LINEAR_PROCESSING',
            '#define TEX2D(c) pow(texture2D(texture, (c)), vec4(CRTgamma))',
        '#else',
            '#define TEX2D(c) texture2D(texture, (c))',
        '#endif',

        'float intersect(vec2 xy) {',
            'float A = dot(xy,xy)+d*d;',
            'float B = 2.0*(R*(dot(xy,sinangle)-d*cosangle.x*cosangle.y)-d*d);',
            'float C = d*d + 2.0*R*d*cosangle.x*cosangle.y;',
            'return (-B-sqrt(B*B-4.0*A*C))/(2.0*A);',
        '}',

        'vec2 bkwtrans(vec2 xy) {',
            'float c = intersect(xy);',
            'vec2 point = vec2(c)*xy;',
            'point -= vec2(-R)*sinangle;',
            'point /= vec2(R);',
            'vec2 tang = sinangle/cosangle;',
            'vec2 poc = point/cosangle;',
            'float A = dot(tang,tang)+1.0;',
            'float B = -2.0*dot(poc,tang);',
            'float C = dot(poc,poc)-1.0;',
            'float a = (-B+sqrt(B*B-4.0*A*C))/(2.0*A);',
            'vec2 uv = (point-a*sinangle)/cosangle;',
            'float r = FIX(R*acos(a));',
            'return uv*r/sin(r/R);',
        '}',

        'vec2 transform(vec2 coord) {',
            'coord = (coord-vec2(0.5))*aspect*stretch.z+stretch.xy;',
            'return (bkwtrans(coord)/overscan/aspect+vec2(0.5));',
        '}',

        'float corner(vec2 coord) {',
            'coord = (coord - vec2(0.5)) * overscan + vec2(0.5);',
            'coord = min(coord, vec2(1.0)-coord) * aspect;',
            'vec2 cdist = vec2(borderRadius);',
            'coord = (cdist - min(coord,cdist));',
            'float dist = sqrt(dot(coord,coord));',
            'return clamp((cdist.x-dist)*borderSharpness,0.0, 1.0);',
        '}',

        '// Calculate the influence of a scanline on the current pixel.',
        '//',
        '// "distance" is the distance in texture coordinates from the current',
        '// pixel to the scanline in question.',
        '// "color" is the colour of the scanline at the horizontal location of',
        '// the current pixel.',
        'vec4 scanlineWeights(float distance, vec4 color) {',

            '// The "width" of the scanline beam is set as 2*(1 + x^4) for each RGB channel.',
            'vec4 wid = 2.0 + 2.0 * pow(color, vec4(4.0));',

            '// The "weights" lines basically specify the formula that gives',
            '// you the profile of the beam, i.e. the intensity as',
            '// a function of distance from the vertical center of the',
            '// scanline. In this case, it is gaussian if width=2, and',
            '// becomes nongaussian for larger widths. Ideally this should',
            '// be normalized so that the integral across the beam is',
            '// independent of its width. That is, for a narrower beam',
            '// "weights" should have a higher peak at the center of the',
            '// scanline than for a wider beam.',
            'vec4 weights = vec4(distance / 0.3);',
            'return 1.4 * exp(-pow(weights * inversesqrt(0.5 * wid), wid)) / (0.6 + 0.2 * wid);',
        '}',

        'void main() {',

            '// Here is a helpful diagram to keep in mind while trying to',
            '// understand the code:',
            '//',
            '//  |      |      |      |      |',
            '// -------------------------------',
            '//  |      |      |      |      |',
            '//  |  01  |  11  |  21  |  31  | <-- current scanline',
            '//  |      | @    |      |      |',
            '// -------------------------------',
            '//  |      |      |      |      |',
            '//  |  02  |  12  |  22  |  32  | <-- next scanline',
            '//  |      |      |      |      |',
            '// -------------------------------',
            '//  |      |      |      |      |',
            '//',
            '// Each character-cell represents a pixel on the output',
            '// surface, "@" represents the current pixel (always somewhere',
            '// in the bottom half of the current scan-line, or the top-half',
            '// of the next scanline). The grid of lines represents the',
            '// edges of the texels of the underlying texture.',

            '// Texture coordinates of the texel containing the active pixel.',
            '#ifdef CURVATURE',
                'vec2 xy = transform(uvs);',
            '#else',
                'vec2 xy = uvs;',
            '#endif',
                'float cval = corner(xy);',

            '// Of all the pixels that are mapped onto the texel we are currently rendering, which pixel are we currently rendering?',
            'vec2 ratio_scale = xy * textureSize - vec2(0.5);',
            '#ifdef OVERSAMPLE',
                'float filter = fwidth(ratio_scale.y);',
            '#endif',
                'vec2 uv_ratio = fract(ratio_scale);',

            '// Snap to the center of the underlying texel.',
            'xy = (floor(ratio_scale) + vec2(0.5)) / textureSize;',

            '// Calculate Lanczos scaling coefficients describing the effect',
            '// of various neighbour texels in a scanline on the current',
            '// pixel.',
            'vec4 coeffs = PI * vec4(1.0 + uv_ratio.x, uv_ratio.x, 1.0 - uv_ratio.x, 2.0 - uv_ratio.x);',

            '// Prevent division by zero.',
            'coeffs = FIX(coeffs);',

            '// Lanczos2 kernel.',
            'coeffs = 2.0 * sin(coeffs) * sin(coeffs / 2.0) / (coeffs * coeffs);',

            '// Normalize.',
            'coeffs /= dot(coeffs, vec4(1.0));',

            '// Calculate the effective colour of the current and next',
            '// scanlines at the horizontal location of the current pixel,',
            '// using the Lanczos coefficients above.',
            'vec4 col  = clamp(mat4(',
                'TEX2D(xy + vec2(-one.x, 0.0)),',
                'TEX2D(xy),',
                'TEX2D(xy + vec2(one.x, 0.0)),',
                'TEX2D(xy + vec2(2.0 * one.x, 0.0))) * coeffs,',
                '0.0, 1.0);',
            'vec4 col2 = clamp(mat4(',
                'TEX2D(xy + vec2(-one.x, one.y)),',
                'TEX2D(xy + vec2(0.0, one.y)),',
                'TEX2D(xy + one),',
                'TEX2D(xy + vec2(2.0 * one.x, one.y))) * coeffs,',
                '0.0, 1.0);',

            '#ifndef LINEAR_PROCESSING',
                'col  = pow(col , vec4(CRTgamma));',
                'col2 = pow(col2, vec4(CRTgamma));',
            '#endif',

            '// Calculate the influence of the current and next scanlines on the current pixel.',
            'vec4 weights  = scanlineWeights(uv_ratio.y, col);',
            'vec4 weights2 = scanlineWeights(1.0 - uv_ratio.y, col2);',
            '#ifdef OVERSAMPLE',
                'uv_ratio.y =uv_ratio.y+1.0/3.0*filter;',
                'weights = (weights+scanlineWeights(uv_ratio.y, col))/3.0;',
                'weights2=(weights2+scanlineWeights(abs(1.0-uv_ratio.y), col2))/3.0;',
                'uv_ratio.y =uv_ratio.y-2.0/3.0*filter;',
                'weights=weights+scanlineWeights(abs(uv_ratio.y), col)/3.0;',
                'weights2=weights2+scanlineWeights(abs(1.0-uv_ratio.y), col2)/3.0;',
            '#endif',
                'vec3 mul_res  = (col * weights + col2 * weights2).rgb * vec3(cval);',

            '// Convert the image gamma for display on our output device.',
            'mul_res = pow(mul_res, vec3(1.0 / monitorgamma));',

            '// Color the texel.',
            'gl_FragColor = vec4(mul_res, 1.0);',
        '}'
    ].join('\n');
};

CRTShader.prototype = Object.create(THREE.ShaderMaterial.prototype);

// Exports.
module.exports = CRTShader;