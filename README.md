bowser-engine
=============

A WebGL game engine based on three.js

## Foreword

Bowser is a game engine based on an exiting technology called [WebGL](http://en.wikipedia.org/wiki/WebGL). More precisely it's based on [three.js](http://www.threejs.org) a library that takes out a lot of WebGL's boilerplate.

For those who are not familiar with the technology, it basically allows to run 2D and 2D games natively in your favorite web browser. This means great things for both players and developers. No need for installation, no dependency on specific hardware and the possibility to self-distribute and self-publish creations. No need for a Steam, Microsoft or Sony to interfere between the two interested parties. Ultimately developers will get more control over their business model and games will be more accessible to the players.

As far as I can remember, the best game I have played where based on tailored engines. When you hold a pad, it all becomes one, the engine, the art and the concept. And when all the pieces fits into eachother nicely, you are up for a good time.

It is following that belief that we are developing Bowser as a game engine that will serve a couple of game projects we have. Coming from a non-web, non-game developer background. There is a lot of history to catch up on. Aproximatively 50 years of Video Game and Internet.

Sometime naive approaches can be creative, but if we are doing weird things, it's probably because we do not have a clue. When it comes to developement choices, we put a lot of thoughts, and if something is done a certain way it is usually deliberate. What is possible though is that the reasons why we did something a certain way are wrong. Your knowledge is gold, please share it with us.

Contribution are welcome, but before you get started, you might want to familiarize youself with a couple of conventions we have on board.

Bowser is a node package and can be installed via npm and used through the CommonJS require convention. The client-side API is a browserified version of the package. We have a single "class" per source file. These only exports the class they are made for. Classes names are based on the file structure. For instance:

 * var Entity2D = require('./2d/Entity');
 * var RenderPass = require('./pass/render');

This is not really following any convention I have seen so far but I feel it is a good idea. It reduces name redunduncy and forces consitency.

We use four space indentation and conform syntax to JSLint standards. 
Long story short, we are trying enforce constrains on the infinite flexibility of Javascript.

Our [website](http://www.bowserjs.org) features a client-side [API documentation](http://docs.bowserjs.org) and [learning examples](http://learn.bowserjs.org) to get you started.
