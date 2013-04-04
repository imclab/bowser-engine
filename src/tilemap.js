var THREE = require('three');
var Entity = require('./entity');
var Misc = require('./misc');

/*
 * @constructor
 * There are several callbacks that can be passed in. See the documentation for each callback in this function.
 * @param: {url} the url to download the map json file from.
 * @param: {mapData} dictionary of mapData. If provided the url parameter is ignored.
 * @param: {imageUrlFind} Find this text in any image urls and replace it with imageUrlReplace. This is useful
 *         because the image path provided by tiled most likely does not match the server url.
 * @param: {imageUrlReplace} The text in imageUrlFind will be replaced by this text.
 * @param: {camera} If provided prevents the camera from moving outside of the tilemap
 * @param: {cameraLockAxis} If a camera is provided, use the axis's with a value of 1. Two axis's should have a 
 *         value of 1 and the third should have a value of 0. Defaults to THREE.Vector3(1, 1, 0)
 * @param: {cameraUVtoAxis} An array of 2 strings. The first value represents the width, and the second represents 
 *         the height. Defaults to ['x', 'y']
camera
cameraLockAxis
cameraUVtoAxis
 * @returns {TileMap} A tile map instance.
 */
var TileMap = function(parameters) {
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
     * @param {propType} This can be used to detect what type of property this is. See TileMap.Prop...
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
    this.nonWalkableIds = [];
    this.animationInfo = {};
    this.collisionLayers = [4];
    this.camera = parameters.camera ? parameters.camera : undefined;
    this.cameraLockAxis = parameters.cameraLockAxis ? parameters.cameraLockAxis : new THREE.Vector3(1, 1, 0);
    this.cameraUVtoAxis = parameters.cameraUVtoAxis ? parameters.cameraUVtoAxis : ['x', 'y'];
    this.typeClasses = parameters.typeClasses ? parameters.typeClasses : [];
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

TileMap.prototype = Object.create(Entity.prototype);
// Property Identifier enums.
TileMap.prototype.PropMap = 1;
TileMap.prototype.PropLayer = 2;
TileMap.prototype.PropTileSet = 3;
TileMap.prototype.PropTile = 4;

/*
 * Loads the geometry. All layers are created.
 */
TileMap.prototype.createGeometry = function() {
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
            for (var id in layer.objects) {
                this.objectFound(layer.name, layer.objects[id]);
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
TileMap.prototype.gidForTileAndLayer = function(parameters) {
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
TileMap.prototype.layerData = function(parameters) {
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
TileMap.prototype.layerId = function(layerName) {
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
TileMap.prototype.layerOpacity = function(parameters) {
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
TileMap.prototype.loadImages = function() {
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

TileMap.prototype.mapToTile = function(position) {
    var ret = position.clone();
    ret.set(ret.x - this.offsetUnits.x, this.offsetUnits.y - ret.y, ret.z);
    return ret;
};

/*
 * @returns {int} the proper material index used to map the proper image atlas to a face.
 */
TileMap.prototype.materialIdForGid = function(gid) {
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

TileMap.prototype.objectFound = function(layerName, objectData) {
    var objectHeight = objectData.height;
    var position = new THREE.Vector3(objectData.x, objectData.y + objectData.height, this.geometries[this.layerId(layerName)].position.z);
    position = tile.mapToTile(position);
    if (objectData.type === "Camera") {
        if (this.camera) {
            this.camera.position.x = position.x;
            this.camera.position.y = position.y;
        }
    } else if ('gid' in objectData) {
        // found a image layer
        if (objectData.type in this.typeClasses) {
            var props = {
                position: position
            };
            if ('animation' in objectData.properties) {
                props['animation'] = objectData.properties.animation;
            }
            if ('layerColliders' in objectData.properties) {
                var names = objectData.properties.layerColliders.split(',');
                var layerColliders = {};
                for (var key in names) {
                    var name = names[key];
                    console.log('Found layer collider', name);
                    if (name in objectData.properties) {
                        var cords = objectData.properties[name].split(',');
                        for (var i = cords.length - 1; i >= 0; i--) {
                            cords[i] = parseInt(cords[i], 10);
                        }
                        var size = new THREE.Vector3(0, 0, 0);
                        var pos = new THREE.Vector3(0, 0, 0);
                        var geo;
                        // Subdivide the collider so a vertex will always be in every tile position
                        var subDivX, subDivY, subDivZ;
                        switch (cords.length) {
                            case 4:
                                pos.x = cords[0];
                                pos.y = cords[1];
                                size.x = cords[2];
                                size.y = cords[3];
                                subDivX = Math.ceil(size.x / this.mapData.tilewidth);
                                subDivY = Math.ceil(size.y / this.mapData.tileheight);
                                break;
                            case 2:
                                size.x = cords[0];
                                size.y = cords[1];
                                subDivX = Math.ceil(size.x / this.mapData.tilewidth);
                                subDivY = Math.ceil(size.y / this.mapData.tileheight);
                                break;
                            case 6:
                                pos.x = cords[0];
                                pos.y = cords[1];
                                pos.z = cords[2];
                                size.x = cords[3];
                                size.y = cords[4];
                                size.z = cords[5];
                                subDivX = Math.ceil(size.x / this.mapData.tilewidth);
                                subDivY = Math.ceil(size.y / this.mapData.tileheight);
                                subDivZ = Math.ceil(size.z / this.mapData.tilewidth);
                                break;
                            case 3:
                                size.x = cords[0];
                                size.y = cords[1];
                                size.z = cords[2];
                                subDivX = Math.ceil(size.x / this.mapData.tilewidth);
                                subDivY = Math.ceil(size.y / this.mapData.tileheight);
                                subDivZ = Math.ceil(size.z / this.mapData.tilewidth);
                                break;
                        }
                        switch (cords.length) {
                            case 2:
                            case 4:
                                geo = new THREE.PlaneGeometry(size.x, size.y, subDivX, subDivY);
                                break;
                            case 3:
                            case 6:
                                geo = new THREE.CubeGeometry(size.x, size.y, size.z, subDivX, subDivY, subDivZ);
                                break;
                        }
                        var mesh = new BOWSER.Collider({
                            geometry: geo,
                            emit: true,
                            receive: false,
                            key: name
                        });
                        mesh.position.set(pos.x + size.x / 2, pos.y + size.y / 2, pos.z);
                        layerColliders[name] = mesh;
                    }
                }
                if (layerColliders) {
                    props['colliders'] = layerColliders;
                }
            }
            var obj = new this.typeClasses[objectData.type](props);
            this.scene.add(obj);
        }
    } else {
        // run the onObjectFound callback for every object found
        if (this.onObjectFound !== undefined) {
            this.onObjectFound(layerName, objectData, this);
        }
    }
};

TileMap.prototype.positionIsWalkable = function(position) {
    var tileIndex = this.tileForPosition(position);
    for (var index in this.collisionLayers) {
        var layerId = this.collisionLayers[index];
        if (this.nonWalkableIds.indexOf(this.mapData.layers[layerId].data[tileIndex]) != -1) {
            return false;
        }
    }
    return true;
};

/*
 * Given a layer name or layer id, set the opacity of the layer.
 * @param: {layerId} The name or index of the layer to change opacity.
 * @param: {opacity} Normalized float value of opacity.
 * @returns {bool} If the layer was found.
 */
TileMap.prototype.setLayerOpacity = function(layerId, opacity) {
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
TileMap.prototype.setMapData = function(mapData) {
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
            for (var tile in tileproperties) {
                this.tilePropFound(tile, tileproperties[tile]);
            }
        }
    }
    this.loaded = true;
    this.scene.showColliders(true);
};

/*
 * Set the tile to the given global id.
 * @param {gid} The new tileset global id.
 * @param {tileId} The tile to apply the gid to.
 * @param {layerId} The layer name or number to apply the gid.
 * Note: If a tile gid requires changing tileset you will need to re-create the geometry.
 */
TileMap.prototype.setTileGid = function(gid, tileId, layerId) {
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

TileMap.prototype.tileForPosition = function(position) {
    var pos = this.tileIdForPosition(position);
    return Math.floor(pos.y) * this.mapData.width + Math.floor(pos.x);
};

TileMap.prototype.tileIdForPosition = function(position) {
    var ret = position.clone();
    //console.log((ret.x + this.offsetUnits.x), this.mapData.height * this.mapData.tileheight - (ret.y + this.offsetUnits.y));
    ret.x = (ret.x + this.offsetUnits.x) / this.mapData.tilewidth;
    ret.y = this.mapData.height - (ret.y + this.offsetUnits.y) / this.mapData.tileheight;
    return ret;
};

TileMap.prototype.tilePropFound = function(gid, properties) {
    // Compensate for the GID in tile properties being off by 1
    gid = parseInt(gid, 10) + 1;
    if ("walkable" in properties) {
        if (properties.walkable === "false") {
            // Keeping a list of all non-walkable tiles would be much larger than a list
            // of non-walkable tiles.
            this.nonWalkableIds.push(gid);
        }
    }
};

TileMap.prototype.update = function() {
    Entity.prototype.update.call(this);
    if (this.camera) {
        var resolution = this.scene.game.resolution;
        for (var i = 0; i < 2; i++) {
            // Map the first value of cameraUVtoAxis to width and the second to height
            var axis = this.cameraUVtoAxis[i];
            var offsetAxis = ['x', 'y'][i];
            var offset = resolution[['width', 'height'][i]];
            if (this.camera.position[axis] < -this.offsetUnits[offsetAxis]) {
                this.camera.position[axis] = -this.offsetUnits[offsetAxis];
            } else if (this.camera.position[axis] + offset > this.offsetUnits[offsetAxis]) {
                this.camera.position[axis] = this.offsetUnits[offsetAxis] - offset;
            }
        }
    }
};

/*
 * Update the uv's for all layers of the tile map.
 * Note: If a tile gid requires changing tileset you will need to re-create the geometry.
 */
TileMap.prototype.updateMapUVs = function() {
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
TileMap.prototype.uvsForGid = function(gid) {
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

TileMap.prototype.walkableForEntity = function(entity) {
    for (var layerName in entity.colliders) {
        var layerData = this.mapData.layers[this.layerId(layerName)].data;
        var collider = entity.colliders[layerName];
        var verts = collider.geometry.vertices;
        for (var index in verts) {
            var pos = entity.position.clone();
            var vertex = verts[index];
            pos.x += collider.position.x + vertex.x;
            pos.y += collider.position.y + vertex.y;
            pos.z += collider.position.z + vertex.z;
            var tileIndex = this.tileForPosition(pos);
            if (this.nonWalkableIds.indexOf(layerData[tileIndex]) != -1) {
                return false;
            }
        }
    }
    return true;
};

// Exports.
module.exports = TileMap;