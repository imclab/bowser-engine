var THREE = require('three');
var Entity = require('../entity');
var Misc = require('../misc');

/*
 * @constructor
 * There are several callbacks that can be passed in. See the documentation for each callback in this function.
 * @param: {url} the url to download the map json file from.
 * @param: {mapData} dictionary of mapData. If provided the url parameter is ignored.
 * @param: {imageUrlFind} Find this text in any image urls and replace it with imageUrlReplace. This is useful
 *         because the image path provided by tiled most likely does not match the server url.
 * @param: {imageUrlReplace} The text in imageUrlFind will be replaced by this text.
 * @returns {TileMap} A tile map instance.
 */
var Tile = function(parameters) {
    "use strict";
    Entity.call(this, parameters);
    // Set to true once the map data is loaded.
    this.loaded = false;
    this.mapData = {};
    // Store a copy of the original map data so we can restore later.
    this.mapDataOriginal = {};
    this.url = parameters.url ? parameters.url : '';
    // Convience params to prevent needing to edit the json file so that the image path matches the web url.
    this.imageUrlFind = parameters.imageUrlFind ? parameters.imageUrlFind : '';
    this.imageUrlReplace = parameters.imageUrlReplace ? parameters.imageUrlReplace : '';
    /* onPropFound(properties, propType, tile)
     * Generic callback if the more specific callbacks were not found.
     * @param {properties} A list of the found properties.
     * @param {propType} This can be used to detect what type of property this is. See Tile.Prop...
     * @param {tile} The BOWSER.Tile object the map parameters belong to.
     */
    this.onPropFound = parameters.onPropFound ? parameters.onPropFound : undefined;
    // Specific property callbacks.
    /* onObjectFound(layerName, objectData, tile)
     * Callback for each object in a object layer.
     * @param {layerName} The name of the layer the object belongs to.
     * @param {objectData} The data stored under the object. You can use this to rebuild the shapes.
     * @param {tile} The BOWSER.Tile object the map parameters belong to.
     */
    this.onObjectFound = parameters.onObjectFound ? parameters.onObjectFound : undefined;
    /* onMapPropsFound(properties, tile)
     * Called if map properties are found.
     * @param {properties} A list of all properties found for the map.
     * @param {tile} The BOWSER.Tile object the map parameters belong to.
     */
    this.onMapPropsFound = parameters.onMapPropsFound ? parameters.onMapPropsFound : undefined;
    /* onLayerPropsFound(layerName, properties, tile)
     * Called for each layer that has properties.
     * @param {layerName} Name of the layer the properties were found on.
     * @param {properties} A list of all properties found for the layer.
     * @param {tile} The BOWSER.Tile object the layer parameters belong to.
     */
    this.onLayerPropsFound = parameters.onLayerPropsFound ? parameters.onLayerPropsFound : undefined;
    /* onTilesetPropsFound(properties, tileset, tile)
     * Called for each tileset with properties on it.
     * @param {properties} A list of all properties found for the tileset.
     * @param {tileset} The tileset the properties were belong to.
     * @param {tile} The BOWSER.Tile object the map parameters belong to.
     */
    this.onTilesetPropsFound = parameters.onTilesetPropsFound ? parameters.onTilesetPropsFound : undefined;
    /* onTilePropFound(gid, properties, tile)
     * Called for each tile that properties are found on.
     * @param {gid} The global id the tile properties belong to.
     * @param {properties} A list of all properties found for the tileset.
     * @param {tile} The BOWSER.Tile object the map parameters belong to.
     */
    this.onTilePropFound = parameters.onTilePropFound ? parameters.onTilePropFound : undefined;
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
// Property Identifier enums.
Tile.prototype.PropMap = 1;
Tile.prototype.PropLayer = 2;
Tile.prototype.PropTileSet = 3;
Tile.prototype.PropTile = 4;

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
            if (this.onObjectFound !== undefined) {
                for (var id in layer.objects) {
                    this.onObjectFound(layer.name, layer.objects[id], this);
                }
            }
        }
    }
};

/*
 * Get the current gid for a given tile.
 * @param {parameters} A dictonary of options
 *      @param {tileId} The tile id number to look up the gid.
 *      @param {layerId} The layer id number or name to look up the gid.
 *      @param {original} Optional, If true return the orginal gid at the last time setMapData was called.
 * @return {int} The gid currently assigned to the tile'
 */
Tile.prototype.gidForTileAndLayer = function(parameters) {
    var layerId = this.layerId(parameters.layerId);
    var tileId = parameters.tileId;
    var layer;
    if (parameters.original && parameters.original === true) {
        layer = this.mapDataOriginal.layers[layerId];
    } else {
        layer = this.mapData.layers[layerId];
    }
    if (layer.type === 'tilelayer' && tileId in layer.data) {
        return layer.data[tileId];
    }
};

/*
 * Given a layer name or layer id, return the opacity of the layer.
 * @param {parameters} A dictonary of options
 *      @param: {layerId} The name or index of the layer to change opacity.
 *      @param {original} Optional, If true return the orginal gid at the last time setMapData was called.
 * @returns {Array} An array of gids for all tiles in this layer.
 */
Tile.prototype.layerData = function(parameters) {
    var layerId = this.layerId(parameters.layerId);
    if (parameters.original && parameters.original === true) {
        return this.mapDataOriginal.layers[layerId].data;
    } else {
        return this.mapData.layers[layerId].data;
    }
};

/*
 * @return {int} || {false} If the layer was found return its index, otherwise return false
 */
Tile.prototype.layerId = function(layerName) {
    var found = false;
    if (typeof layerName === 'number') {
        return layerName;
    }
    for (var i = 0; i < this.mapData.layers.length; i++) {
        if (this.mapData.layers[i].name === layerName) {
            layerName = i;
            return i;
        }
    }
    return false;
};

/*
 * Given a layer name or layer id, return the opacity of the layer.
 * @param {parameters} A dictonary of options
 *      @param: {layerId} The name or index of the layer to change opacity.
 *      @param {original} Optional, If true return the orginal gid at the last time setMapData was called.
 * @returns {float} The opacity of the layer.
 */
Tile.prototype.layerOpacity = function(parameters) {
    var layerId = this.layerId(parameters.layerId);
    if (parameters.original && parameters.original === true) {
        return this.mapDataOriginal.layers[layerId].opacity;
    } else {
        return this.mapData.layers[layerId].opacity;
    }
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
    ret.set(ret.x - this.offsetUnits.x, this.offsetUnits.y - ret.y, ret.z);
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
 * @param: {layerId} The name or index of the layer to change opacity.
 * @param: {opacity} Normalized float value of opacity.
 * @returns {bool} If the layer was found.
 */
Tile.prototype.setLayerOpacity = function(layerId, opacity) {
    layerId = this.layerId(layerId);
    var materials = this.geometries[layerId].material.materials;
    for (var material in materials) {
        materials[material].opacity = opacity;
    }
    this.mapData.layers[layerId].opacity = opacity;
    return true;
};

/*
 * Process the given map data, load its tileset images, and create the geometry.
 * @param: {mapData} Dictonary of map data.
 */
Tile.prototype.setMapData = function(mapData) {
    this.mapData = mapData;
    // Duplicate the map data so you can compare the current state to the original.
    this.mapDataOriginal = JSON.parse(JSON.stringify(this.mapData));
    for (var geo in this.geometries) {
        this.remove(geometries[geo]);
    }
    this.offsetUnits.set(this.mapData.tilewidth * this.mapData.width / 2, this.mapData.tileheight * this.mapData.height / 2);
    this.materials = [];
    this.geometries = [];
    this.loadImages();
    this.createGeometry();
    this.updateMapUVs();
    // Process map properties
    if (Object.getOwnPropertyNames(this.mapData.properties).length !== 0) {
        if (this.onMapPropsFound !== undefined) {
            this.onMapPropsFound(this.mapData.properties, this);
        } else {
            // Emit generic callback if one was not provided.
            if (this.onPropFound !== undefined) {
                this.onPropFound(this.mapData.properties, this.PropMap, this);
            }
        }
    }
    // process Layer properties
    var layers = this.mapData.layers;
    for (var layer in layers) {
        if ('properties' in layers[layer]) {
            if (this.onLayerPropsFound !== undefined) {
                this.onLayerPropsFound(layers[layer].name, layers[layer].properties, self);
            } else {
                // Emit generic callback if one was not provided.
                if (this.onPropFound !== undefined) {
                    this.onPropFound(layers[layer].properties, this.PropLayer, this);
                }
            }
        }
    }
    var tilesets = this.mapData.tilesets;
    for (var tileset in tilesets) {
        // Process tileset properties
        if (Object.getOwnPropertyNames(tilesets[tileset].properties).length !== 0) {
            if (this.onTilesetPropsFound !== undefined) {
                this.onTilesetPropsFound(tilesets[tileset].properties, tilesets[tileset], this);
            } else {
                // Emit generic callback if one was not provided.
                if (this.onPropFound !== undefined) {
                    this.onPropFound(tilesets[tileset].properties, this.PropTileSet, this);
                }
            }
        }
        // Process individual tile properties
        if ('tileproperties' in tilesets[tileset]) {
            var tileproperties = tilesets[tileset].tileproperties;
            if (this.onTilePropFound !== undefined) {
                for (var tile in tileproperties) {
                    this.onTilePropFound(tile, tileproperties[tile], this);
                }
            } else {
                // Emit generic callback if one was not provided.
                if (this.onPropFound !== undefined) {
                    this.onPropFound(tileproperties, this.PropTile, this);
                }
            }
        }
    }
    this.loaded = true;
};

/*
 * Set the tile to the given global id.
 * @param {gid} The new tileset global id.
 * @param {tileId} The tile to apply the gid to.
 * @param {layerId} The layer name or number to apply the gid.
 * Note: If a tile gid requires changing tileset you will need to re-create the geometry.
 */
Tile.prototype.setTileGid = function(gid, tileId, layerId) {
    layerId = this.layerId(layerId);
    var layer = this.mapData.layers[layerId];
    if (layer.type === 'tilelayer') {
        var faces = this.geometries[layerId].geometry.faces;
        var facesUVS = this.geometries[layerId].geometry.faceVertexUvs[0];
        var faceUVs = this.uvsForGid(gid);
        // Note: MaterialIndex is only used once, at first render when it breaks geometry into batches 
        //       of triangles with the same material. If you need to update the guid for a tile you should
        //       make sure all required tiles are on the same texture set.
        faces[tileId].materialIndex = (this.materialIdForGid(gid));
        for (var k = 0; k < faceUVs.length; k++) {
            facesUVS[tileId][k].set(faceUVs[k].x, faceUVs[k].y);
        }
        layer.data[tileId] = gid;
        this.geometries[layerId].geometry.uvsNeedUpdate = true;
    }
};

/*
 * Update the uv's for all layers of the tile map.
 * Note: If a tile gid requires changing tileset you will need to re-create the geometry.
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
                // Note: MaterialIndex is only used once, at first render when it breaks geometry into batches 
                //       of triangles with the same material. If you need to update the guid for a tile you should
                //       make sure all required tiles are on the same texture set.
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