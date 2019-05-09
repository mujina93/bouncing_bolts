// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"eMEv":[function(require,module,exports) {
// for headless authoritative server game instance
const path = require('path');

const jsdom = require('jsdom'); // express is a web framework that will help us
// render our static files


var express = require('express');

var app = express(); // new express instance
// supply the app to the HTTP server, which will
// allow express to handle the HTTP requests

var server = require('http').Server(app);

const Datauri = require('datauri');

const datauri = new Datauri();
const {
  JSDOM
} = jsdom; // for headless authoritative server game instance
// require socket.io, a module that allows for
// bi-directional communication between server and client
// Then, make the module listen to our server object

var io = require('socket.io').listen(server); /// TODO clean stuff moved to auth../game.js
// // // // players object: store data about the players
// // // var players = {};
// // // all projectiles flying around
// // var bullets = [];
// // collectibles TODO change
// var star = {
//     x: Math.floor(Math.random()*700)+50,
//     y: Math.floor(Math.random()*700)+50
// };
// // scores TODO change
// var scores = {
//     blue: 0,
//     red: 0
// };
// // logic to listen for connections and disconnections
// io.on('connection', function(socket){
//     console.log('a user connected');
//     // create a new player and add it to our players object
//     // assign to it a position, and id, and a random team
//     players[socket.id] = {
//         rotation: 0,
//         x: Math.floor(Math.random()*700) + 50,
//         y: Math.floor(Math.random()*500) + 50,
//         playerId: socket.id,
//         team: (Math.floor(Math.random()*2)===0)?'red':'blue'
//     };
//     // emit events ...
//     // send the players object to the new player
//     // .emit just emits the event to the current
//     // client (the player that has just connected)
//     // We are passing the players object to the
//     // new peer, so that he can populate his screen
//     console.log('emitting currentPlayers event');
//     socket.emit('currentPlayers', players);
//     // emit collectible stars
//     console.log('emit star location');
//     socket.emit('starLocation', star);
//     // emit scores
//     console.log('emit scores');
//     socket.emit('scoreUpdate', scores);
//     // update all other players of the new player
//     // .broadcast.emit emits the event to all other
//     // sockets (the existing players)
//     // We are passing the data of the new player to
//     // all other players, so that they can update
//     console.log('emitting newPlayer event to all the other peers')
//     socket.broadcast.emit('newPlayer',players[socket.id]);
//     // react to events ...
//     // add peer disconnect callback
//     socket.on('disconnect', function(){
//         // when this peers disconnects...
//         console.log('user disconnected');
//         // remove this player from our player object
//         delete players[socket.id];
//         // emit a message to all players to remove this player
//         io.emit('disconnect', socket.id);
//     });
//     // callback for playerMovement event
//     // (event fired by a player who is moving and has
//     // changed its state)
//     socket.on('clientPlayerMoved', function(movementData){
//         //console.log(`storing position for ${socket.id}. Broadcasting.`);
//         // update this player's data on the server
//         players[socket.id].x = movementData.x;
//         players[socket.id].y = movementData.y;
//         players[socket.id].rotation = movementData.rotation;
//         // broadcast a message about the player that moved
//         socket.broadcast.emit('serverPlayerMoved', players[socket.id]);
//     });
//     socket.on('clientShot', function(bulletData){
//         bullets.push();
//     });
//     // when a player collects a star, it signals
//     // it to the server. The server stores the info,
//     // and bounces-broadcast back update events
//     socket.on('starCollected', function(){
//         if (players[socket.id].team === 'red'){
//             scores.red += 10;
//         } else {
//             scores.blue += 10;
//         }
//         // spawn new star
//         star.x = Math.floor(Math.random()*700) + 50;
//         star.y = Math.floor(Math.random()*500) + 50;
//         // emit events with new star location and
//         // updated scores
//         console.log('emitting star location and scores');
//         io.emit('starLocation', star);
//         io.emit('scoreUpdate', scores);
//     })
// });
/// TODO start from here to make phaser and socket available locally instead of
/// from CDN. Check https://stackoverflow.com/questions/27464168/how-to-include-scripts-located-inside-the-node-modules-folder
// app.get('/phaser.min.js', function(req, res) {
//     res.sendFile(__dirname + '/../node_modules/phaser/dist/phaser.min.js');
// });
// app.get('/socket.io/socket.io.js', function(req, res) {
//     res.sendFile(__dirname + '/../node_modules/socket.io-client/dist/socket.io.js');
// });
// update the server to rendere static files using
// the express.static middleware function


app.use(express.static('../public')); //__dirname + '/../public'));
// serve the index.html as the root page ('/')

app.get('/', function (req, res) {
  res.sendFile('../index.html'); //__dirname + '/../index.html');
}); // // make the server listen on port 8081
// server.listen(8081, function(){
//     console.log(`Listening on ${server.address().port}`);
// });
// run game instance on authoritative server

function setupAuthoritativePhaser() {
  JSDOM.fromFile('./authoritative_server/index.html', {
    //path.join(__dirname, 'authoritative_server/index.html'), {
    // To run the scripts in the html file
    runScripts: "dangerously",
    // Also load supported external resources
    resources: "usable",
    // So requestAnimatinFrame events fire
    pretendToBeVisual: true
  }).then(dom => {
    // listen for clients only when game instance on server is ready
    // datauri - to avoid error on server
    dom.window.URL.createObjectURL = blob => {
      if (blob) {
        return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]].buffer).content;
      }
    };

    dom.window.URL.revokeObjectURL = objectURL => {}; // on the event gameLoaded, start listening


    dom.window.gameLoaded = () => {
      server.listen(8081, function () {
        console.log(`Listening on ${server.address().port}`);
      });
    }; // inject socket.io instance into jsdom, which
    // will allow us to access it in our Phaser
    // code that is running on the server


    dom.window.io = io;
  }).catch(error => {
    console.log(error.message);
  });
}

setupAuthoritativePhaser(); // (async function(){
//     global.dom = await JSDOM.fromFile('../public/index.html', {
//       // To run the scripts in the html file
//       runScripts: "dangerously",
//       // Also load supported external resources
//       resources: "usable",
//       // So requestAnimatinFrame events fire
//       pretendToBeVisual: true
//     })
//   })();
},{}]},{},["eMEv"], null)
//# sourceMappingURL=server.js.map