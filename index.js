// Exports.
module.exports = {

    // Libraries.
    THREE: require('three'),
    PATHFINDING: require('pathfinding'),

    // Classes.
    Action: require('./src/action'),
    Loader: require('./src/loader'),
    Collider: require('./src/collider'),
    PerspectiveCamera: require('./src/camera/perspective'),
    OrthographicCamera: require('./src/camera/orthographic'),
    CRTShader: require('./src/shader/crt'),
    Entity2D: require('./src/2d/entity'),
    Entity3D: require('./src/3d/entity'),
    Game: require('./src/game'),
    Grid: require('./src/grid'),
    JumpAction: require('./src/action/jump'),
    Misc: require('./src/misc'),
    Resolution: require('./src/resolution'),
    Scene2D: require('./src/2d/scene'),
    Scene3D: require('./src/3d/scene'),
    Sound: require('./src/sound'),
    Tile: require('./src/2d/tile'),
    TileMap: require('./src/tilemap')
};
