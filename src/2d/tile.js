var THREE = require('three');
var Entity = require('../entity');
var Misc = require('../misc');

/*
 * @constructor
 * @param: {url} the url to download the map json file from.
 * @param: {imageUrlFind} Find this text in any image urls and replace it with imageUrlReplace. This is useful
 *         because the image path provided by tiled most likely does not match the server url.
 * @param: {imageUrlReplace} The text in imageUrlFind will be replaced by this text.
 * @param: {onObjectFound} Every time a object is found on a object layer this function will be called.
 *          You can use this to create entities or process info. It passes two arguments, the layer name and 
 *          the object parameters provided by Tiled.
 * @param: {mapData} dictionary of mapData. If provided ignores url parmiter.
 * @returns {TileMap} A tile map instance.
 */
var Tile = function(parameters) {
    "use strict";
    Entity.call(this, parameters);
    this.mapData = {};
    this.url = parameters.url ? parameters.url : '';
    // Convience params to prevent needing to edit the json file so that the image path matches the web url.
    this.imageUrlFind = parameters.imageUrlFind ? parameters.imageUrlFind : '';
    this.imageUrlReplace = parameters.imageUrlReplace ? parameters.imageUrlReplace : '';
    // If a object layer is found this function will be called for each object that was found.
    this.onObjectFound = parameters.onObjectFound ? parameters.onObjectFound : function(layerName, objectData, tile) {
        console.log('Found object', objectData.name, 'on layer', layerName);
    };
    // A dictonary of pointers to tileset images
    this.materials = [];
    // Each pice of geometry in this array is a renderable layer
    this.geometries = [];
    // used to map cordinates to tile maps.
    this.offsetUnits = new THREE.Vector2();
    // Load the map data
    if (parameters.mapData) {
        this.setMapData(parameters.mapData);
    } else if (this.url) {
        var that = this;
        Misc.getJSON(this.url, function(json) {
            that.setMapData(json);
        });
    }
};

Tile.prototype = Object.create(Entity.prototype);

/*
 * Loads the geometry. All layers are created.
 */
Tile.prototype.createGeometry = function() {
    this.geometries = [];
    // Create the layers from the back layer to the front
    for (var i = this.mapData.layers.length - 1; i >= 0; i--) {
        var layer = this.mapData.layers[i];
        if (layer.type === "tilelayer") {
            // Create the plane geometry with a 1:1 pixel to unit rato
            var geometry = new THREE.PlaneGeometry(this.offsetUnits.x * 2, this.offsetUnits.y * 2, layer.width, layer.height);
            var materials = [];
            // Clone the materials so we can adjust the opacity on a layer by layer basis
            // https://github.com/mrdoob/three.js/issues/1507#issuecomment-4679121
            // mrdoob: If you clone a material the compiled program gets shared. Meaning that only one program exist in memory and each material have unique uniform values.
            for (var j = 0; j < this.materials.length; j++) {
                materials.push(this.materials[j].clone());
            }
            var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
            mesh.position.z = i * 0.5;
            mesh.name = layer.name;
            this.geometries[i] = mesh;
            this.add(mesh);
        } else if (layer.type === 'objectgroup') {
            this.geometries[i] = new THREE.Geometry();
            this.geometries[i].position = new THREE.Vector3(0, 0, i * 0.5);
            // run the onObjectFound callback for every object found
            for (var id in layer.objects) {
                this.onObjectFound(layer.name, layer.objects[id], this);
            }
        }
    }
};

/*
 * @return {int} || {false} If the layer was found return its index, otherwise return false
 */
Tile.prototype.layerId = function(layerName) {
    var found = false;
    for (var i = 0; i < this.mapData.layers.length; i++) {
        if (this.mapData.layers[i].name === layerName) {
            layerName = i;
            return i;
        }
    }
    return false;
};

/*
 * Load all images in the tileset and create textures to be used as tiles.
 */
Tile.prototype.loadImages = function() {
    for (var i = 0; i < this.mapData.tilesets.length; i++) {
        var url = this.mapData.tilesets[i].image;
        var name = this.mapData.tilesets[i].name;
        var texture = THREE.ImageUtils.loadTexture(url.replace(this.imageUrlFind, this.imageUrlReplace), new THREE.UVMapping());
        texture.name = name;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipMapNearestFilter;
        this.materials.push(new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        }));
    }
};

Tile.prototype.mapToTile = function(position) {
    var ret = position.clone();
    ret.set( ret.x - this.offsetUnits.x, this.offsetUnits.y - ret.y, ret.z );
    return ret;
};

/*
 * @returns {int} the proper material index used to map the proper image atlas to a face.
 */
Tile.prototype.materialIdForGid = function(gid) {
    var tilesets = this.mapData.tilesets;
    var ret = 0;
    for (var i = 0; i < tilesets.length; i++) {
        if (gid >= tilesets[i].firstgid) {
            ret = i;
        } else {
            break;
        }
    }
    return ret;
};

/*
 * Given a layer name or layer id, set the opacity of the layer.
 * @param: {layer} The name or index of the layer to change opacity.
 * @param: {opacity} Normalized float value of opacity.
 * @returns {bool} If the layer was found.
 */
Tile.prototype.setLayerOpacity = function(layer, opacity) {
    if (typeof layer === 'string') {
        layer = this.layerId(layer);
        if (layer === false) {
            return false;
        }
    }
    var materials = this.geometries[layer].material.materials;
    for (var material in materials) {
        materials[material].opacity = opacity;
    }
    return true;
};

/*
 * Process the given map data, load its tileset images, and create the geometry.
 * @param: {mapData} Dictonary of map data.
 */
Tile.prototype.setMapData = function(mapData) {
    this.mapData = mapData;
    for (var geo in this.geometries) {
        this.remove(geometries[geo]);
    }
    this.offsetUnits.set(this.mapData.tilewidth * this.mapData.width / 2, this.mapData.tileheight * this.mapData.height / 2);
    this.materials = [];
    this.geometries = [];
    this.loadImages();
    this.createGeometry();
    this.updateMapUVs();
};

/*
 * Update the uv's for all layers of the tile map.
 */
Tile.prototype.updateMapUVs = function() {

    // Make each tile point to the correct image and update the uv cordinates
    for (var i = 0; i < this.geometries.length; i++) {
        var layer = this.mapData.layers[i];
        if (layer.type === 'tilelayer') {
            var faces = this.geometries[i].geometry.faces;
            var facesUVS = this.geometries[i].geometry.faceVertexUvs[0];
            var layerData = layer.data;
            for (var j = 0; j < facesUVS.length; j++) {
                var faceUVs = this.uvsForGid(layerData[j]);
                faces[j].materialIndex = (this.materialIdForGid(layerData[j]));
                for (var k = 0; k < faceUVs.length; k++) {
                    facesUVS[j][k].set(faceUVs[k].x, faceUVs[k].y);
                }
            }
            this.geometries[i].geometry.uvsNeedUpdate = true;
            // for some reason this hides the layers under it.
            this.geometries[i].visible = this.mapData.layers[i].visible;
            this.setLayerOpacity(i, this.mapData.layers[i].opacity);
        }
    }
};

/*
 * Returns the uv cordinates for a face to show a tile of the given Global ID. These are
 * in the same order as geometry.faceVertexUvs.
 * Note: Currently you can not have a image larger than the size required for tiles.
 * @param: {gid} The Global ID to generate uv cordinates for.
 * @returns {array} An array of 4 THREE.Vector2's.
 */
Tile.prototype.uvsForGid = function(gid) {
    var ret = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()];
    // This tile has no id set treat it as empty
    if (gid === 0) {
        return ret;
    }
    var matID = this.materialIdForGid(gid);
    var tileset = this.mapData.tilesets[matID];
    var imagewidth = tileset.imagewidth;
    var imageheight = tileset.imageheight;
    var tilewidth = tileset.tilewidth;
    var tileheight = tileset.tileheight;
    var spacing = tileset.spacing;
    var margin = tileset.margin;
    // This is the tile id for this texture
    var localid = gid - tileset.firstgid;
    // Calulate the number of tiles wide the document is
    var tilesWide = Math.floor((imagewidth + spacing - margin * 2) / (tilewidth + spacing));
    var tilesHeigh = Math.floor((imageheight + spacing - margin * 2) / (tileheight + spacing));
    // Calculate the tile address
    var row = Math.floor(localid / tilesWide);
    var column = localid - tilesWide * row;

    var iWidth = tilesWide * tilewidth + (tilesWide - 1) * spacing + margin * 2;
    var iHeight = tilesHeigh * tileheight + (tilesHeigh - 1) * spacing + margin * 2;

    var normSpacing = spacing / iWidth;
    var normMargin = margin / iWidth;
    var normTileWidth = tilewidth / iWidth;
    var normTileHeight = tileheight / iHeight;

    // Note I had to fudge the calculations for rect[0].x buy adding a percet of normSpacing.
    ret[0].set(column * normTileWidth + column * normSpacing + normMargin + normSpacing * 0.35,
    1 - (row * normTileHeight + row * normSpacing - normMargin));
    ret[1].set(ret[0].x, ret[0].y - normTileHeight);
    ret[2].set(ret[0].x + normTileWidth - normSpacing, ret[1].y);
    ret[3].set(ret[2].x, ret[0].y);

    return ret;
};

// Exports.
module.exports = Tile;