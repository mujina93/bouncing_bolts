import {findClientsPlayer} from '../../../common/js/utils';

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example', //if this element does not exist, phaser will create a canvas for it
    width: 600,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        width: 600,
        height: 600,
        checkCollision: {
            left: true,
            right: true,
            up: true,
            down: true
        }
        // gravity: { y: 0 }
      }
    },
    // inputMouse: true,
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    autoFocus: false // avoid warnings on authoritative game instance
};
   
function preload() {}

// players info object: store data about the players
const playersData = {}; /// TODO change players to playersInfo, or self.players to self.playersGameObjects

function create() {
  // this.physics.world.setBoundsCollision();
  // console.log(this);
  // var callback = function(
  //   body, blockedUp, blockedDown, blockedLeft, blockedRight) {
  //    console.log("world collision");
  //    console.log(blockedUp);
  //    console.log(blockedDown);
  //    console.log(blockdLeft);
  //    console.log(blockedRight); };
  // this.physics.world.on('worldbounds', callback);

  // reference the Phaser scene
  const self = this;   

  // manage players as a Phaser group
  this.playersGO = this.physics.add.group();

  // flying bullets
  this.bullets = this.physics.add.group();

  /// TODO wrap in function
  // setup explosion animation
  var config = {
    key: 'burst',
    frames: self.anims.generateFrameNumbers('explosion'),
    frameRate: 24,
    yoyo: false,
    repeat: 0
  };
  var anim = self.anims.create(config); // useful?

  // logic to listen for connections and disconnections
  io.on('connection', function(socket){
    console.log('server: a user connected');
    // create a new player and add it to our players object
    // assign to it a position, and id, and a random team
    playersData[socket.id] = { 
        rotation: 0,
        x: Math.floor(Math.random()*550) + 50,
        y: Math.floor(Math.random()*550) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random()*2)===0)?'red':'blue',
        input: {
          left: false,
          right: false,
          up: false,
          down: false
        }
    };
    
    // create player in the world (of server's game)
    const playersInfo = playersData[socket.id];
    serverAddPlayer(self, playersInfo);

    // emit events ...

    // send the players object to the new player
    // .emit just emits the event to the current
    // client (the player that has just connected)
    // We are passing the players object to the
    // new peer, so that he can populate his screen
    console.log('  server: emitting serverCurrentPlayers event');
    socket.emit('serverCurrentPlayers', playersData);

    // emit collectible stars
    console.log('  server: emit star location');
    socket.emit('serverStarRespawned', {
      x: self.star.x,
      y: self.star.y
    });

    // emit scores
    console.log('  server: emit scores');
    socket.emit('serverScoreUpdated', self.scores);
    
    // update all other players of the new player
    // .broadcast.emit emits the event to all other
    // sockets (the existing players)
    // We are passing the data of the new player to
    // all other players, so that they can update
    console.log('  server: emitting newPlayer event to all the other peers')
    socket.broadcast.emit('serverNewOtherPlayer', playersData[socket.id]);
    
    
    // react to events ...

    // when this (socket) client disconnects,
    // remove its data and game objects from server game
    // and broadcast the event to inform other clients
    // (they will remove the disconnected player from
    // their games)
    socket.on('disconnect', function(){
        // when this peers disconnects...
        console.log('user disconnected');
        // remove player (game object) of disconnected
        // client (socket.id) from this (server) game instance
        removePlayer(self, socket.id);
        // remove player data from server
        delete playersData[socket.id];
        // emit a message to all other clients to remove this player
        io.emit('serverOtherPlayerDisconnected', socket.id);
    });

    // callback for playerMovement event
    // (event fired by a player who is moving and has
    // changed its state)
    /// TODO CONTINUE solve, this is not received
    socket.on('clientMovementInput', function(inputData){
      // console.log("server: received input");  
      handlePlayerInput(self, socket.id, inputData);
        // //console.log(`storing position for ${socket.id}. Broadcasting.`);
        // // update this player's data on the server
        // playersData[socket.id].x = movementData.x;
        // playersData[socket.id].y = movementData.y;
        // playersData[socket.id].rotation = movementData.rotation;
        // // broadcast a message about the player that moved
        // socket.broadcast.emit('serverPlayerMoved', playersData[socket.id]);
    });

    socket.on('clientShot', function(bulletData){
      console.log("server: client just shot");

      var player = findClientsPlayer(self.playersGO, socket.id);

      var direction = new Phaser.Math.Vector2(
        bulletData.x - player.x,
        bulletData.y - player.y)
        .normalize();

      const OFFSET_CASTER_BULLET = 30; /// TODO move globally
      var position_pl = new Phaser.Math.Vector2(player.x, player.y);
      var position_bullet = position_pl.add(direction.clone().scale(OFFSET_CASTER_BULLET));
      var bullet = self.add.image(position_bullet.x,
                                  position_bullet.y,
                                     'bullet')
                                  .setOrigin(0.5,0.5)
                                  .setDisplaySize(15,15);
                                  // .setTint(0xff5500);
      self.bullets.add(bullet);
      /// NOTE! set bullet properties only AFTER you have added the bullet to the group
      // otherwise phaser wipes off the data!
      bullet.body.setCollideWorldBounds(true);
      bullet.body.setBounce(0.9,0.9);
      
      const MAX_BULLET_SPEED = 300; /// TODO move global
      bullet.body.setVelocity(
          direction.x * MAX_BULLET_SPEED,
          direction.y * MAX_BULLET_SPEED
      );

      // add id for identification
      bullet.id = getGlobalIncreasingBulletId();
      
      // setup collision bullets-players
      self.physics.add.overlap(
        self.playersGO, 
        self.bullets, 
        callbackBulletOnPlayer,
        null,
        self);
      
      io.emit('serverBulletSpawned',{
        bulletId: bullet.id,
        x: bullet.x,
        y: bullet.y
      });
      
    });

    /// TODO remove
    // // when a player collects a star, it signals
    // // it to the server. The server stores the info,
    // // and bounces-broadcast back update events
    // socket.on('starCollected', function(){
    //     if (playersData[socket.id].team === 'red'){
    //         scores.red += 10;
    //     } else {
    //         scores.blue += 10;
    //     }
    //     // spawn new star
    //     star.x = Math.floor(Math.random()*700) + 50;
    //     star.y = Math.floor(Math.random()*500) + 50;
        
    //     // emit events with new star location and
    //     // updated scores
    //     console.log('emitting star location and scores');
    //     io.emit('starLocation', star);
    //     io.emit('scoreUpdate', scores);
    // })
  });

  // collectibles TODO change
  this.star = this.physics.add.image(
    randomPosition(600), /// TODO harcoded view size
    randomPosition(600)
  );

  console.log("server: just set coliders on playersGO");
  // add colliders to players game objects
  this.physics.add.collider(this.playersGO);

  // scores TODO change
  this.scores = {
    blue: 0,
    red: 0
  };

  // add effect on overlap with stars
  this.physics.add.overlap(
    this.playersGO, 
    this.star, 
    function(star, player){
      // console.log(player.playerId);
      // console.log(playersData[player.playerId]);
      // console.log(playersData[player.playerId].team);
      if (playersData[player.playerId].team === 'red'){
        self.scores.red += 10;
      } else {
        self.scores.blue += 10;
      }

      self.star.setPosition(
        randomPosition(600),
        randomPosition(600)
      );

      io.emit('serverScoreUpdated', self.scores);
      io.emit('serverStarRespawned',{
        x: self.star.x,
        y: self.star.y
      });
  });
}

function callbackBulletOnPlayer(player, bullet){
  console.log("server: player touched bullet!");
  bullet.destroy();
  const collisionData = {
    playerId: player.playerId,
    bulletId: bullet.id
  };
  io.emit('serverBulletOnPlayer', collisionData);
}

// /// TODO refactor using findInGroupGivenId(phaserGroup, id,
// /// or use just that function
// function findClientsPlayer(playersGO, socketId) {
//   var targetPlayer = null;
//   playersGO.getChildren().some(function (player) {
//     console.log(player.playerId)
//     console.log(socketId);
//     // console.log("TYPES: " + typeof(player.playerId) + " " + typeof(socketId));
//     console.log("SAME? ");
//     console.log(player.playerId === socketId);
//     // console.log(player.playerId.length + ' ' + socketId.length);
//     if (player.playerId === socketId) {
//       targetPlayer = player;
//       return true; // returning true to some() breaks the loop
//     }
//   });
//   if (targetPlayer === null){
//     console.log(`PROBLEM! player not found with id: ${socketId}`);
//   }
//   // playersGO.getChildren().forEach(function (player) {
//   //   console.log(player.playerId);
//   // });
//   return targetPlayer;
// }

/// TODO refactor and rename playerId in playersGO to simply id,
/// then use this function in place of specific ones for finding players and bullets
function findInGroupGivenId(phaserGroup, id, idPropertyName='id'){
  var target = null;
  phaserGroup.getChildren().some(function (member) {
    // console.log(player.playerId)
    // console.log(socketId);
    // console.log("TYPES: " + typeof(player.playerId) + " " + typeof(socketId));
    // console.log("SAME? ");
    // console.log(player.playerId === socketId);
    // console.log(player.playerId.length + ' ' + socketId.length);
    if (member[idPropertyName] === id) {
      target = member;
      return true; // returning true to some() breaks the loop
    }
  });
  if (target === null){
    console.log(`PROBLEM! member not found with id: ${id}`);
  }
  // playersGO.getChildren().forEach(function (player) {
  //   console.log(player.playerId);
  // });
  return target;
}

function randomPosition(max, margin=50){
  return Math.floor(Math.random()*(max-margin))+margin;
};

function update() {

  this.playersGO.getChildren().forEach(updatePlayer);
  broadcastBulletsUpdate(this); /// TODO optimize by just sending when there are bullets
}
// var i = 0; // TODO remove debug
function updatePlayer(player){
  const input = playersData[player.playerId].input;
  // if (!(i % 100)){
  //   console.log(input);
  //   i+= 1;
  // }
  if (input.left){
    // console.log("left");
    player.setVelocity(
      - player.body.maxVelocity.x,
        player.body.velocity.y
    );
    // console.log("player on server:");
    // console.log(player);
    // console.log("is at: ");
    // console.log(player.x, player.y);
  } else if (input.right) {
    player.setVelocity(
      + player.body.maxVelocity.x,
        player.body.velocity.y
    );
  } else {
    player.setVelocity(
      0,
      player.body.velocity.y
    );
  }

  if (input.up){
    // console.log("server: pressing up");
    player.setVelocity(
        player.body.velocity.x,
      - player.body.maxVelocity.y
    );
  } else if (input.down) {
    player.setVelocity(
        player.body.velocity.x,
      + player.body.maxVelocity.y
    );
    // console.log(player.x, player.y);
  } else {
    player.setVelocity(
      player.body.velocity.x,
      0
    );
  }

  // save position in players data, and send it
  playersData[player.playerId].x = player.x;
  playersData[player.playerId].y = player.y;
  playersData[player.playerId].rotation = player.rotation;
  // console.log("server on update");
  // console.log(playersData[player.playerId].x);
  // console.log(playersData[player.playerId].y);
  io.emit('serverPlayerUpdated', playersData);
}

function broadcastBulletsUpdate(self){
  // bullets gets updated automatically since
  // it has initial velocity and max bounce

  
  var bulletIds = new Array();
  var  xs =  new Array();
  var  ys = new Array();
  self.bullets.getChildren().forEach(function(bullet,i ){
    // console.log("EEEEEEEEEEEEEEEEEEE");
    // console.log(typeof(bulletsData.bulletIds));
    // console.log(bulletsData.bulletIds.prototype);
    bulletIds.push(bullet.id);
    xs.push(bullet.x);
    ys.push(bullet.y);
  });

  // SOA to send
  var bulletsData = {
      bulletIds,
      xs,
      ys
  };
  io.emit('serverBulletsUpdated', bulletsData);
}

function serverAddPlayer(self, playerInfo){
  console.log(`server: adding player ${playerInfo.playerId}`);
  // self is the peer who is adding a player
  // playerInfo is the info of the player to add
  // 
  // on 'currentPlayers' event, a client receives
  // data about all the players (among them, the 
  // data about its own player), and calls this
  // function with playerInfo which is its own
  // player's info. Therefore, when he calls this,
  // he is creating its own player.

  // add this player's sprite
  // using self.physics.add.image instead of
  // self.add.image we allow for the game object
  // to use the arcade physics
  const player = self.physics.add.image(playerInfo.x, 
                                     playerInfo.y, 
                                     'ship')
                              .setOrigin(0.5, 0.5)
                              .setDisplaySize(53, 40); // set origin in the middle for rotations
  // set this player's color
  if(playerInfo.team === 'blue'){
      player.setTint(0x0000ff);
  } else {
      player.setTint(0xff0000);
  }
  /// TODO clean
  // // sets physics properties
  // player.setDrag(100);
  // player.setAngularDrag(100);
  player.setMaxVelocity(200);

  // setup collider that checks collisions with other players
  self.physics.add.collider(player, self.otherPlayers, function(me, other){ /// TODO other, me?
      // inform emit a collision event (the server will handle it)
      // NOTHING FOR NOW
  }, null, self);

  self.physics.add.collider(player, self.projectiles, function(ship, bullet){ /// TODO bullet, ship?
      /// TODO destroy and perform effect based on proj type
      console.log("HIT!");
      bullet.destroy();
      
      // this.add.image(32, 32, 'explosion', '__BASE').setOrigin(0); //  Show the whole animation sheet
      var explosion = this.add.sprite(ship.x, ship.y, 'explosion')
                              .setScale(1);
      // explosion.anims.load('burst'); // useful ?
      // progress = this.add.text(100, 500, 'Progress: 0%', { color: '#00ff00' });
      explosion.anims.play('burst');
      // this.input.keyboard.on('keydown_SPACE', function (event) {sprite.anims.play('walk');});
  }, null, self); // self, the context, is the Arcade.World


  

  // add the ship game object to the server's game instance's players group
  self.playersGO.add(player);

  // add playerId field to the actual player's game object,
  // so that we later know which one to remove when a client
  // with that id disconnects
  player.playerId = playerInfo.playerId;
  console.log("server: added player to group and added Id");
  self.playersGO.getChildren().forEach(function(player){
    console.log(player.playerId);
  });
  // NOTE! this must be AFTER player gets added to playersGO group,
  // since apparently Phaser wipes properties that were set on
  // objects that get added to groups (???)
  // See http://www.html5gamedevs.com/topic/38972-solved-issue-with-world-bounds-collision/
  player.body.setCollideWorldBounds(true);
}

// remove a player from a game instance (passed as self)
function removePlayer(self, playerId){
  // search for given id and remove that player
  self.playersGO.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  })
}

function handlePlayerInput(self, playerId, input) {
  // save input data for player that has inputted
  self.playersGO.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      playersData[player.playerId].input = input;
    }
  });
  // console.log("server");
  // console.log(self.playersGO);
}

function getGlobalIncreasingBulletId(){
  if(this.counter === undefined) {
    this.counter = -1;
  } 
  this.counter++; 
  /// TODO maybe introduce modularity? (e.g. if this.counter === 1000000 -> this.counter = 0)
  return this.counter;
}

const game = new Phaser.Game(config);
console.log("game created");
// tell the server that the authoritative game instance is ready
window.gameLoaded();