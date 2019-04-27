
// client's code. Every client running the game
// runs this
// configuration for creating the game
var config = {
    type: Phaser.AUTO,
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
    inputMouse: true,
    scene: {
      preload: preload,
      create: create,
      update: update
    } 
};

// creates game
var game = new Phaser.Game(config);
 
function preload() {
    // assets: tag/name, path
    this.load.image('ship','assets/spaceShips_001.png');
    this.load.image('otherPlayer','assets/enemyBlack5.png');
    this.load.image('star','assets/star_gold.png');
    this.load.image('bullet','assets/fireball.png');
    this.load.spritesheet('explosion', 'assets/explosion_spritesheet130x130.png', 
        { frameWidth: 130, frameHeight: 130 });
}

function create() {
    // let's call this instance of the game
    // (the client's instance): "self"
    var self = this;

    // the client instantiates an io object
    // use socket.on(..) to react to server events
    // use socket.emit() to send events to server
    this.socket = io();

    // players list on client (mirroring the ones on server)
    this.players = this.add.group();

    /// TODO deprecated
    // group with the other players' objects
    // this is gradually filled either when this
    // peer connects to a game with other players
    // already in, or when new players come in
    // a game when this peer is already playing
    this.otherPlayers = this.physics.add.group();

    /// flying bullets on client. They are just 
    // graphical mirrors of what happens on server
    this.bullets = this.physics.add.group();

    // add a callback on 'currentPlayers' event
    // (this event is emitted by the server to
    // this client when he is connecting, and
    // it allows the server to send the data of
    // all current players to this new client)
    // When C connects, C receives this event with
    // data for players A, B (already there) and C
    // (its own player's data). C instantiates the players
    // in its own game (both its own and the others')
    this.socket.on('serverCurrentPlayers', function(playersData){
        console.log(`${self.socket.id}: serverCurrentPlayers event received`);
        // for each key in the players object...
        // (the keys are the socket's ids of the clients)
        Object.keys(playersData).forEach(function(id) {
            const playerInfo = playersData[id];
            if (playerInfo.playerId === self.socket.id) {
                clientAddPlayer(self, playerInfo, 'ship'); /// TODO take sprite from data
            } else {
                clientAddPlayer(self, playerInfo, 'otherPlayer'); /// TODO take sprite from data
            }
            // // if one of them matches this client's id,
            // // add this player using the data in players[id]
            // if (players[id].playerId === self.socket.id){
            //     addPlayer(self, players[id]);
            // } else {
            // // otherwise, let this client adds the
            // // other players (not himself) to his game
            //     addOtherPlayers(self, players[id]);
            // }
        });
    });

    // callback on 'newPlayer' event
    // (this event is broadcast by the server to
    // all the other peers other than the one which
    // has just started a connection)
    // When C connects, the server sends this event to
    // A and B (already playing). They add C's player
    // (spaceship) to their own games.
    this.socket.on('serverNewOtherPlayer', function(playerInfo){
        console.log(`${self.socket.id}: newPlayer event received`);
        clientAddPlayer(self, playerInfo, 'otherPlayer');
    });

    // callback on 'disconnect' event
    // This client receives the event 'disconnect' which
    // tells him the id of the disconnected player (playerId).
    // This client looks in its own list of other players
    // for the id of the disconnected one, and destroys it
    // (in its own game).
    // So when A disconnects, the server (S) broadcasts the
    // "A disconnected" event to all the peers (say, to B 
    // and C). B and C call this callback and destroy the
    // A's spaceship on their game instance.
    this.socket.on('serverOtherPlayerDisconnected', function(playerId){
        console.log(`${self.socket.id}: player ${playerId} disconnected`);
        // remove disconnected player from your game
        self.players.getChildren().forEach(function(player){
            if (playerId === player.playerId) {
                player.destroy();
            }
        });
    });

    /// TODO remove
    // // callback for 'playerMoved' event
    // // (event bounce-broadcast by the server, that
    // // informs everyone that another player has moved
    // // in its client)
    // // A moves, and sends its new data to the server
    // // the served store A's new data and broadcast it
    // // to A, B, C. A ignores the bounced-back event,
    // // since the playerInfo.playerId won't be in the
    // // "otherPlayers" for this peer. B and C instead
    // // update their A (A's ship in their games).
    // this.socket.on('serverPlayerMoved', function(playerInfo){
    //     // update all players on client
    //     self.otherPlayers.getChildren().forEach(function(otherPlayer){
    //         if(playerInfo.playerId === otherPlayer.playerId){
    //             otherPlayer.setRotation(playerInfo.rotation);
    //             otherPlayer.setPosition(playerInfo.x, playerInfo.y);
    //         }
    //     });
    // });

    /// TODO impl
    this.socket.on('serverBulletMoved', 
        function(bulletInfo){
            // update all players on client
            self.bullets.getChildren()
                        .forEach(
                            function(b){
                                if(bulletInfo.bulletId === b.bulletId){
                                    // otherPlayer.setRotation(bulletInfo.rotation);
                                    b.setPosition(bulletInfo.x, playerInfo.y);
                                }
                            }
                        );
        }
    );

    this.socket.on('serverPlayerUpdated', function(playersData) {
        // console.log(`${self.socket.id}: players updated`);
        Object.keys(playersData).forEach(function(id) {
            self.players.getChildren().forEach(function(player) {
                if (playersData[id].playerId === player.playerId) {
                    player.setRotation(playersData[id].rotation);
                    // console.log("client on serverPlayerUpdated");
                    // console.log(playersData[id].x);
                    // console.log(playersData[id].y);
                    player.setPosition(playersData[id].x, playersData[id].y);
                }
            })
        });
    });

    // cursors
    // this.cursors = this.input.keyboard.createCursorKeys();
    // spacebar to be polled
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cursors = {
        up: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.W),
        left: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.A),
        down: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.S),
        right: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.D),
    };
    // flags that allow to send the server
    // only a message when the key is pressed
    // and when is released
    this.movementKeyPressed = {
        up: false,
        left: false,
        down: false,
        right: false
    };

    // mouse events
    function logPointerOnMouseDown(pointer, currentlyOver){
        var coords = [pointer.worldX, pointer.worldY];
        console.log(coords);
    };
    function logShip(pointer, currentlyOver){
        // pointer.event.view.
        // var coords = [pointer.worldX, pointer.worldY];
        console.log(self.ship);
    };
    function logEvent(pointer, currentlyOver){
        console.log(pointer);
        console.log(currentlyOver); // array of game objects currently under pointer
    }
    function clientShot(pointer, currentlyOver){
        self.socket.emit('clientShot',
                        {
                            x: pointer.worldX,
                            y: pointer.worldY
                        });
    }
    // this.input.mouse.onMouseDown = logEvent; // can set to other things
    // this.input.mouse.startListeners(); // activate the callbacks set on the Mouse Input Plugin
    this.input.on(
        'pointerdown',
        clientShot
    );


    // score label
    this.blueScoreText = this.add.text(
        16, 16, '', 
        { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(
        460, 16, '', 
        { fontSize: '32px', fill: '#FF0000' });

    // callback for scoreUpdate (update labels)
    // (all the actual math and the scores are
    // just in the server)
    this.socket.on('serverScoreUpdated', function (scores) {
        console.log(`${self.socket.id}: scoreUpdate received`);
        self.blueScoreText.setText('Blue: ' + scores.blue);
        self.redScoreText.setText('Red: ' + scores.red);
    });

    // callback for starLocation
    // This event is broadcast by the server and
    // informs about the (new) star location
    this.socket.on('serverStarRespawned', function (starLocation) {
        console.log(`${self.socket.id}: starLocation received. Positioning star`);    
        // destroy the old star object
        if (self.star) self.star.destroy();
        // create a new star object on client's game
        self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
        // overlap handling is done server side
        // // add overlap callback, thanks to which
        // // when this player overlaps with the star,
        // // it emits a starCollected event
        // // (the server will handle then the logic)
        // self.physics.add.overlap(self.ship, self.star, function () {
        //     console.log(`${self.socket.id}: star touched. emitting starCollected`);
        //     this.socket.emit('starCollected');
        // }, null, self);
    });
}

/// TODO clean
// function serverAddPlayer(self, playerInfo){
//     console.log(`${self.socket.id}: adding player ${playerInfo.playerId} (itself)`);
//     // self is the peer who is adding a player
//     // playerInfo is the info of the player to add
//     // 
//     // on 'currentPlayers' event, a client receives
//     // data about all the players (among them, the 
//     // data about its own player), and calls this
//     // function with playerInfo which is its own
//     // player's info. Therefore, when he calls this,
//     // he is creating its own player.

//     // add this player's sprite
//     // using self.physics.add.image instead of
//     // self.add.image we allow for the game object
//     // to use the arcade physics
//     self.ship = self.physics.add.image(playerInfo.x, 
//                                        playerInfo.y, 
//                                        'ship')
//                                 .setOrigin(0.5, 0.5)
//                                 .setDisplaySize(53, 40); // set origin in the middle for rotations
//     // set this player's color
//     if(playerInfo.team === 'blue'){
//         self.ship.setTint(0x0000ff);
//     } else {
//         self.ship.setTint(0xff0000);
//     }
//     // sets physics properties
//     self.ship.setDrag(100);
//     self.ship.setAngularDrag(100);
//     self.ship.setMaxVelocity(200);

//     // setup collider that checks collisions with other players
//     self.physics.add.collider(self.ship, self.otherPlayers, function(me, other){
//         // inform emit a collision event (the server will handle it)
//         // NOTHING FOR NOW
//     }, null, self);

//     // setup explosion animation
//     var config = {
//         key: 'burst',
//         frames: self.anims.generateFrameNumbers('explosion'),
//         frameRate: 24,
//         yoyo: false,
//         repeat: 0
//     };
//     var anim = self.anims.create(config); // useful?

//     self.physics.add.collider(self.ship, self.projectiles, function(ship, bullet){
//         /// TODO destroy and perform effect based on proj type
//         console.log("HIT!");
//         bullet.destroy();
        
//         // this.add.image(32, 32, 'explosion', '__BASE').setOrigin(0); //  Show the whole animation sheet
//         var explosion = this.add.sprite(ship.x, ship.y, 'explosion')
//                                 .setScale(1);
//         // explosion.anims.load('burst'); // useful ?
//         // progress = this.add.text(100, 500, 'Progress: 0%', { color: '#00ff00' });
//         explosion.anims.play('burst');
//         // this.input.keyboard.on('keydown_SPACE', function (event) {sprite.anims.play('walk');});
//     }, null, self); // self, the context, is the Arcade.World

//     self.ship.setCollideWorldBounds(true);
// }


// used when a client (self) wants to add another player 
// (playerInfo) to his game
// Difference with addPlayer(): the player described by
// playerInfo is added in the otherPlayers group for the
// adding client (self). And there is no logic that sets
// the physics of the new player, since that is not
// handled in this (self) client's game, but elsewhere.
// function addOtherPlayers(self, playerInfo){
//     console.log(`${self.socket.id}: adding other player ${playerInfo.playerId}`);
//     const otherPlayer = self.add.sprite(playerInfo.x, 
//                                         playerInfo.y,
//                                         'otherPlayer')
//                                 .setOrigin(0.5,0.5)
//                                 .setDisplaySize(53,40);
//     if (playerInfo.team === 'blue'){
//         otherPlayer.setTint(0x0000ff);
//     } else {
//         otherPlayer.setTint(0xff0000);
//     }
//     // adding the other player to self.otherPlayers group
//     otherPlayer.playerId = playerInfo.playerId;
//     self.otherPlayers.add(otherPlayer);
// }

function update() {
    // update only if there is a ship
    // if (this.ship) {
    // movement ...
    const previousLeft = this.movementKeyPressed.left;
    const previousRight = this.movementKeyPressed.right;
    const previousUp = this.movementKeyPressed.up;
    const previousDown = this.movementKeyPressed.down;

    if (this.cursors.left.isDown) {
        this.movementKeyPressed.left = true;
    } else if (this.cursors.right.isDown) {
        this.movementKeyPressed.right = true;
    } else {
        this.movementKeyPressed.left = false;
        this.movementKeyPressed.right = false;
    }

    if (this.cursors.up.isDown) {
        this.movementKeyPressed.up = true;
    } else if (this.cursors.down.isDown) {
        this.movementKeyPressed.down = true;
    } else {
        this.movementKeyPressed.up = false;
        this.movementKeyPressed.down = false;
    }

    // orient
    var pointer = {
        x: this.input.mousePointer.worldX,
        y: this.input.mousePointer.worldY
    }
    /// TODO orient sprite based on pointer, and send updated rotation
    
    if (this.spaceBar.isDown) {
        // DEBUG PRINT
        console.log(this.cursors);
    }

    // emit movement commands, so that
    // actual movement happens on server
    if (previousLeft !== this.movementKeyPressed.left
    ||  previousRight !== this.movementKeyPressed.right
    ||  previousDown !== this.movementKeyPressed.down
    ||  previousUp !== this.movementKeyPressed.up){
        // console.log(`input:`);
        // console.log(this.movementKeyPressed);
        this.socket.emit('clientMovementInput',
            this.movementKeyPressed
            // {
            //     left: this.movementKeyPressed.left,
            //     right: this.movementKeyPressed.right,
            //     down: this.movementKeyPressed.down,
            //     up: this.movementKeyPressed.up
            // }
        );
    }

    // snake-like wrapping if out, go on the other side of the screen
    // this.physics.world.wrap(this.ship,5);
    
    // // emit player movement
    // // (the server will receive this, will store
    // // this player's new data, and will broadcast
    // // a 'playerMoved' event to all the others)
    // var x = this.ship.x;
    // var y = this.ship.y;
    // var r = this.ship.rotation;
    // // only if something of this ship's data has changed, emit the new data
    // if (this.ship.oldPosition && 
    //     (x !== this.ship.oldPosition.x
    //     || y !== this.ship.oldPosition.y
    //     || r !== this.ship.oldPosition.rotation)){
        
    //     // only server will react to this, and will update player's data
    //     // on server and broadcast another event to which clients will react then
    //     this.socket.emit('clientPlayerMoved',
    //                     {x: this.ship.x,
    //                     y: this.ship.y,
    //                     rotation: this.ship.rotation});
    // }
    
    // // save old position data
    // this.ship.oldPosition = {
    //     x: this.ship.x,
    //     y: this.ship.y,
    //     rotation: this.ship.rotation
    // }
}

function clientAddPlayer(self, playerInfo, sprite){
    // create player's sprite on client
    const player = self.add.sprite(
        playerInfo.x, 
        playerInfo.y,
        sprite)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(53,40);
    if (playerInfo.team === 'blue') 
        player.setTint(0x0000ff);
    else 
        player.setTint(0xff0000);
    // assign it the player id (coming from playerInfo
    // from server's event)
    player.playerId = playerInfo.playerId;
    // add this new player to the client's list of players
    self.players.add(player);
}