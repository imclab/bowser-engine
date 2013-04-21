# BOWSER-ENGINE
===============

### Enquiring

bowser-engine is a game engine based on an exciting open source technology called [WebGL](http://en.wikipedia.org/wiki/WebGL). More precisely it's based on [three.js](http://www.threejs.org), a library that takes out a lot of WebGL's boilerplate allowing us to focus on the gaming part.

For those who are not familiar with this technology, it basically allows to run 2D and 3D games natively in your [favorite](https://www.google.com/intl/en/chrome/browser) web browser. That includes Chrome, Safari and Firefox. This means great things for both players and developers. No need for installation, no dependency on specific hardware and the possibility to self-distribute and self-publish your creations. Ultimately developers will get more control over their business model and games will be more accessible to the players.

As far as we can remember, the best game we have played were based on tailored engines. When you hold a gamepad and play, it all becomes one, the engine, the art and the concept. And when all the pieces fits into eachother nicely, you are up for a good time.

It is following that belief that we are developing bowser-engine as a platform that will serve a couple of game projects we have. Coming from a non-web, non-game developer background, we have a lot of history to catch up on. Aproximatively 50 years of Video Game and Internet.

Sometime naive approaches can be creative, but if we are doing weird things, it's probably because we tried our best but did not know better. Your knowledge is gold, please share it with us.

### Using

Bowser-engine is a client-side library therefore the easiest way to use it is to add the following line of code to your HTML page.

`<script type="text/javascript" src="http://www.bowserjs.org/release/bowser.js"></script>`

You can now use the bowser-engine API in your page using node style require function.

```
require('bowser-engine');
```

That being said, the Web has evolved and nowadays websites are moving from being a set of static and dynamic pages served by a master server to self-sufficient sub-servers that can be deployed anywhere. Each of them are responsible for their own language and conventions and provide an standardized access through an IP address and a port. This is why **bowser-engine** is actually a node package before being Javascript library.

We all know that in order to run client-side, whatever code you have written needs to endup into a single file requested by your page. That being said, this single file made out of thousands of lines of code and refering to global variable that are not even declared in the file itself does not reflect the way you want to be developing. You want to be able to organize your code into separate files that refere to each other and this what node brings to the table. 

You can now start coding in a comfortable environment, having your own package organized and reliying on dozen of other packages. When you are ready to deploy), you will be using [browserify](http://browserify.org/) in order to transform all this goodness into a single JavaScript file that run on the client.

Getting node can be achieved using your [favorite](http://www.macports.org/) package manager or, alternatively, through [nodejs.org](http://nodejs.org). Once you have it installed, just issue the following command from the terminal.

```
npm install bowser-engine
```
This will download and install the latest version of bowser-engine inside a node_modules folder from your current terminal working directory. I personally recommand browserifying server-side on request but if you really want that single client-side JavaScript file, install browserify globally.

```
npm install -g browserify
```

Once donce, issue the following command in the terminal from the bowser-engine folder.

```
npm run-script build
``` 

A bowser.js file will be available in the build folder.

### Developing

Bowser-engine had an auto-generated [documentation](http://www.bowserjs.org/docs/bowser-engine) and the bowser.js [website](http://bowserjs.org) has [examples](learn.bowserjs.org) to get you started. For the sake of centralizing information please refere to these pages to start learning about the API. Now, wait no longer. Pronounce the magic words `require('bowser-engine')` to enter a world of high adventure.

