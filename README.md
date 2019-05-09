# TODO

[ ] bundle: webpack/parcel
[ ] ES6 + babel
[ ] modularize
[ ] finish implementing bullets system multiplayer
[ ] remove scratch.js from github
[ ] phaser and socket as local or CDN? check [link](https://stackoverflow.com/questions/27464168/how-to-include-scripts-located-inside-the-node-modules-folder)


# Resources

[authoritative game instance](https://phasertutorials.com/creating-a-simple-multiplayer-game-in-phaser-3-with-an-authoritative-server-part-1/)

[Host authoritative server on Heroku](https://phasertutorials.com/hosting-your-multiplayer-phaser-game-on-heroku/)


[Physics.Arcade.Factory](https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Factory.html)
is the one referred as this.physics.add


# Dev Diary

* 28 Apr 19: 
    * Installed [babel](https://github.com/babel/example-node-server) for having ES6 imports
    * Babel moves stuff into another folder (/dist). To solve path resolutions I install [babel-plugin-module-resolution](https://github.com/tleunen/babel-plugin-module-resolver)
    * Need to solve relative paths mess (__dirname and stuff), with babel moving js files around. Also, need to understand how to target all js files and how to apply to my situation in which I have 2 main pieces of application (server game and client game). After reading about Webpack solution I try to go with [Parcel](https://parceljs.org/getting_started.html) bundler (which should include [ES6 transpilation](https://parceljs.org/javascript.html#default-babel-transforms))
    * Able to target server.js with parcel builder as npm script in package.json, thanks to the examples for [targetting node](https://github.com/parcel-bundler/examples/blob/master/node/package.json). Stuff is built/bundled/transpiled/dumped to dist/ folder.
    * I still have issue with paths (e.g. with finding paths that JSDOM should find to simulate the headless browser to run the server game instance)
    * What is exactly --public-url in parcel build?

# Examples 
https://github.com/yigitusta/Cavemen-GGJ2019
parcel

https://github.com/ignacioxd/ragin-mages/blob/master/server/package.json 
Babel + Gulp

https://github.com/Lightnet/project-phaser3-prototype come sopra

https://github.com/geckosio/phaser3-multiplayer-game-example/blob/master/package.json babel + parcel


| project | server | server dependencies and node scripts | client | client dependencies and nodes script  | project structure | exports/imports | bundle | pluses |
|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [caveman](https://github.com/yigitusta/Cavemen-GGJ2019) | express, just bookkeeping of globals with no game instance, deployed on heroku | express, socket.io, nodemon (dev)  "dev": "nodemon server.js" | index.html includes src/index.js as script, which creates the game with window.game = new Phaser.Game(config); | phaser, socket.io-client, parcel (dev), cssnano (dev)  "start": "parcel index.html --open", "build": "parcel build index.html" | client/   package.json   defs/     phaser.d.ts   src/     assets/     components/     scenes/     utils/     CST.js     index.js   index.html common/ server.js |  export default {  ... };  export default class Player extends Phaser.GameObjects.Container { ... } import LoadScene from './scenes/LoadScene'; | parcel (client) |  |
| [ragin mages](https://github.com/ignacioxd/ragin-mages) | app = express() server = http.Server(app) socketio = io(http) server.listen(...) socketio.listen(...) new PlayerManager(socketio)  PlayerManager handles all network (it has the real server logic) |  express, socket.io, uuid, babel/core (dev), babel/preset-env (dev), cross-env (dev), del (dev), gulp (dev), gulp-babel (dev), gulp-eslint (dev), gulp-sourcemaps (dev) "start": "node node_modules/cross-env/dist/bin/cross-env.js PORT=3030 node build/index.js", "build": "gulp build", "clean": "gulp clean" | index.html including js/phaser.min.js,  js/socket.io.js, and js/game.js   Game.js extends Phaser.Game creating Game class,  adding a method 'resizeGame' and a window.addEventListener with 'resize' and this.resizeGame.bind(this). Then, this Game class is instantiated as the game. | looootttsss, using Yarn for dependency management.  (babel all possible plugins, several other helpers,  gulp, phaser, socket.io).  HUGE gulpfile.js   "start": "gulp", "build": "gulp build", "build:dev": "gulp build-dev" | server/   src/     game/       PlayerManager.js     index.js   .babelrc   .eslintrc   gulpfile.js   package.json   yarn.lock config/   config.json(heroku) game/   src/     assets/     css/     js/       objects/       scenes/       util/       Game.js       sw.js     *.png/svg/ico     browserconfig.xml     site.webmanifest     index.html   .babelrc   .eslintrc   gulpfile.js   package.json   yarn.lock |   import GameScene from 'scenes/GameScene'; | gulp | in game/util there are things for Server and Controller ? Don't understand.  Several forks. |
| [lightnet prototype](https://github.com/Lightnet/project-phaser3-prototype) |  main.js creates express instance (which uses helmet instance). requestHandler = server.listen(...) io = socketIO(requestHandler) gameEngine = new MyGameEngine(...) serverEngine = new MyServerEngine(io, gameEngine, ...) serverEngine.start() MyServerEngine extends lance/ServerEngine.  MyGameEngine is the class, extending lance/GameEngine, which implements  game functionality (initialization, creation and destruction of entities, etc. It is NOT a Phaser game - or maybe it is under the hood?).   Both server and client engines classes will take a gameEngine as argument in construction and will use that. | all in one package.json together with client | index.html includes /socket.io/socket.io.js and bundle.js  In client/clientEntryPoint.js:  gameEngine = new MyGameEngine(options); clientEngine = new MyClientEngine(gameEngine, options); document.addEventListener('DOMContentLoaded', e => clientEngine.start())  MyClientEngine contains the logic. Interestingly, it can select the controls based on whether there is a mobile or keyboard input. | express, helmet, lance-gg, phaser, query-string, socket.io, babel (dev), browserify (dev), gulp (dev)  "test": "node test.js", "start": "gulp default" | .vscode/   tasks.json assets/   */ docs/   *.md src/   client/     clientEntryPoint.js     *.js   common/     *.js   server/     MyServerEngine.js     *.js .babelrc gulpfile.js index.html main.js package.json test.js(empty) | module.exports = MobileControls;  import MyRenderer from './MyRenderer'; import querystring from 'query-string'; | gulp |  work in progress resource links on readme.md and in docs/  mobile controls  usage of 'get' keyword (?)  server can make bots  server has random name generation  both server and client game classes make use of a gameEngine class that comes from lance library |