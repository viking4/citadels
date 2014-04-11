/**************************************************
 ** NODE.JS REQUIREMENTS
 **************************************************/
var util = require("util"),	// Utility resources (logging, object inspection, etc)
  io = require("../public/node_modules/socket.io/lib/socket.io"),	// Socket.IO
  Player = require("./player").Player,
  Game = require("./game").Game;

/**************************************************
 ** GAME VARIABLES
 **************************************************/
var socket,	// Socket controller
  players,	// Array of connected players
  games;


/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
// Create an empty array to store players
  players = {};
  games = {};
// Set up Socket.IO to listen on port 7000
  socket = io.listen(7000);

// Configure Socket.IO
  socket.configure(function() {
// Only use WebSockets
    socket.set("transports", ["websocket"]);

// Restrict log output
    socket.set("log level", 2);
  });

// Start listening for events
  setEventHandlers();
}


/**************************************************
 ** GAME EVENT HANDLERS
 **************************************************/
var setEventHandlers = function() {
// Socket.IO
  socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
  util.log("New client has connected: "+client.id);

// Listen for client disconnected
  client.on("disconnect", onClientDisconnect);

// Listen for new player message
  client.on("new client", onNewClient);
  client.on("new player", onNewPlayer);
  client.on("remove player", onRemovePlayer);
  client.on("join room", onJoinRoom);
  client.on("leave room", onLeaveRoom);

  client.on("new game", onNewGame);
  client.on("select character", onSelectCharacter);
  client.on("play character", onPlayCharacter);
  client.on("draw district cards", onDrawDistrictCards);

  client.on("gold", onGold);
  client.on("owned districts", onOwnedDistricts);
  client.on("district hand", onDistrictHand);
}

// Socket client has disconnected
function onClientDisconnect() {
  util.log("Client has disconnected: "+this.id);

  var player = playerById(this.id);
  if (!player) {
    util.log("Player not found: "+this.id);
    return;
  }

  util.log("Player has been removed: "+player.nickname);
  this.broadcast.emit("remove player", {nickname: player.nickname});
  delete players[player.nickname];
}
function onNewClient() {
  var i, playerKeys = Object.keys(players);
  for (i = 0; i < playerKeys.length; i++) {
    this.emit("new player", players[playerKeys[i]]);
  }
}
// New player has joined
function onNewPlayer(data) {
// Create a new player
  var newPlayer = new Player(this.id, data.nickname);

// Broadcast new player to connected socket clients
  this.broadcast.emit("new player", newPlayer);

// Send existing players to the new player
  var roomKeys = Object.keys(socket.sockets.manager.rooms);
  for (var i = 0, ii = roomKeys.length; i < ii; i++) {
    if (roomKeys[i] != "") {
      var roomName = roomKeys[i].substring(1);
      var roster = socket.sockets.clients(roomName);
      for (i = 0, ii = roster.length; i < ii; i++) {
        var player = playerById(roster[i].id);
        this.emit("join room", {roomName: roomName, player: player});
      }

    }
  }
// Add new player to the players array
  util.log("New player has been created: "+ this.id);
  players[newPlayer.nickname] = newPlayer;
}

function onRemovePlayer () {
  var removePlayer = playerById(this.id);
  util.log("A player has been removed: "+removePlayer.nickname);
  this.broadcast.emit("remove player", {nickname: removePlayer.nickname});
  delete players[removePlayer.nickname];
}

function onJoinRoom (data) {
  this.join(data.roomName);
  util.log("A player joins room: "+data.roomName);

  var joinPlayer = playerById(this.id);
  this.broadcast.emit("join room", {roomName: data.roomName, player: joinPlayer});
}

function onLeaveRoom (data) {
  var leavePlayer = playerById(this.id);
  this.leave(data.roomName);
  util.log("A player leaves room: "+leavePlayer.roomName);

  this.broadcast.emit("leave room", {roomName: data.roomName, player: leavePlayer});
}
function onNewGame (data) {
  var roster = socket.sockets.clients(data.roomName);

  var order = [];
  for (var i = 0, ii = roster.length; i < ii; i++) {
    var player = playerById(roster[i].id);
    order.push({id: player.id, nickname: player.nickname});
  }

  var game = new Game(order);
  game.districtDeck.shuffle();
  util.log("A player has started a game");

  for ( i = 0, ii = roster.length; i < ii; i++) {
    var cards = game.districtDeck.draw(4);
    var player = playerById(roster[i].id);
    player.setGold(2);
    player.setDistrictHand(cards);
    roster[i].emit("new game", {gold: 2, hand: cards, order: order});
  }
  game.characterDeck.shuffle();
  this.emit("select character", {nickname: playerById(this.id).nickname, characterDeck: game.characterDeck.deck});
  games[data.roomName] = game;
}

function onSelectCharacter (data) {
  var game = games[data.roomName];
  game.selectCharacter(this.id, data.character);
  if (data.characterDeck.length > 0) {
    this.broadcast.to(data.roomName).emit("select character", {nickname: game.nextPlayerNickname(this.id), characterDeck: data.characterDeck});
  } else {
    var rank = 1, nickname = game.characterSelection[rank];
    while (!nickname) {
      this.broadcast.to(data.roomName).emit("no character", rank);
      nickname = game.characterSelection[++rank];
    }
    this.broadcast.to(data.roomName).emit("play character", {nickname: nickname, rank: rank});
  }
}
function onPlayCharacter (data) {

}
function onDrawDistrictCards (data) {
  var cards = games[data.roomName].districtDeck.draw(data.draw);
  var player = playerById(this.id);
  this.emit("draw district cards", cards);
}
function onGold (data) {
  var player = playerById(this.id);
  player.setGold(data.gold);
  this.broadcast.to(data.roomName).emit("gold", {nickname: player.nickname, gold: player.gold})
}
function onDistrictHand (data) {
  var player = playerById(this.id);
  player.setDistrictHand(data.districtHand);
  this.broadcast.to(data.roomName).emit("number of district cards", {nickname: player.nickname, numberOfDistrictCards: data.districtHand.length});
}
function onOwnedDistricts (data) {
  var player = playerById(this.id);
  player.setOwnedDistricts(data.ownedDistricts);
  this.broadcast.to(data.roomName).emit("owned districts", {nickname: player.nickname, ownedDistricts: data.ownedDistricts});
}
/**************************************************
 ** GAME HELPER FUNCTIONS
 **************************************************/
// Find player by ID
function playerById(id) {
  var keys = Object.keys(players);
  for (var i = 0, ii = keys.length; i < ii; i++) {
    var player = players[keys[i]];
    if (player.id == id)
      return player;
  }
  return false;
}

/**************************************************
 ** RUN THE GAME
 **************************************************/
init();