// Exports.
module.exports = {

    // Libraries.
    THREE: require('three'),
    PATHFINDING: require('pathfinding'),

    // Classes.
    Game: require('./src/game'),
    Sound: require('./src/sound'),
    Scene2D: require('./src/2d/scene'),
    Scene3D: require('./src/3d/scene'),
    Entity2D: require('./src/2d/entity'),
    Entity3D: require('./src/3d/entity'),
    Collider: require('./src/collider'),
    Resolution: require('./src/resolution'),
    Misc: require('./src/misc'),
    Grid: require('./src/grid'),
    Tile: require('./src/2d/tile')
};
