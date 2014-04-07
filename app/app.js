// Object.spawn() for classical inheritance
Object.defineProperty(Object.prototype, "spawn", {value: function (props) {
  var defs = {}, key;
  for (key in props) {
    if (props.hasOwnProperty(key)) {
      defs[key] = {value: props[key], enumerable: true};
    }
  }
  return Object.create(this, defs);
}});

/**************************************************
 ** NODE.JS REQUIREMENTS
 **************************************************/
var util = require("util"),	// Utility resources (logging, object inspection, etc)
  io = require("socket.io"),	// Socket.IO
  Player = require("./player").Player,	// Player class
  Game = require("./game").Game;	// Game class


/**************************************************
 ** GAME VARIABLES
 **************************************************/
var socket,	// Socket controller
  games,
  players;	// Array of connected players


/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
// Create an empty array to store players
  players = [];
  games = [];
// Set up Socket.IO to listen on port 8000
  socket = io.listen(8000);

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
  util.log("New player has connected: "+client.id);

// Listen for client disconnected
  client.on("disconnect", onClientDisconnect);

// Listen for new player message
  client.on("new player", onNewPlayer);

  client.on("join game", onJoinGame);

  client.on("leave game", onLeaveGame)
}

// Socket client has disconnected
function onClientDisconnect() {
  util.log("Player has disconnected: "+this.id);

  var removePlayer = playerById(this.id);

// Player not found
  if (!removePlayer) {
    util.log("Player not found: "+this.id);
    return;
  }

// Remove player from players array
  players.splice(players.indexOf(removePlayer), 1);

// Broadcast removed player to connected socket clients
  this.broadcast.emit("remove player", {id: this.id});
}

// New player has joined
function onNewPlayer(data) {
// Create a new player
  var newPlayer = Player.spawn();
  newPlayer.id = this.id;

// Send client info back to the new player
  this.emit("on client", {id: newPlayer.id});

// Broadcast new player to connected socket clients
  this.broadcast.emit("new player", {id: newPlayer.id});

// Send existing players to the new player
  var i, existingPlayer;
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i];
    this.emit("new player", {id: existingPlayer.id});
  }
  var roomKeys = Object.keys(socket.sockets.manager.rooms);
  for (var i = 0, ii = roomKeys.length; i < ii; i++) {
    if (roomKeys[i] != "") {
      var existingGame = gameById(roomKeys[i].substring(1));
      this.emit("new game", {id: existingGame.id, name: existingGame.name});
    }
  }
// Add new player to the players array
  players.push(newPlayer);
}

function onJoinGame (data) {
  this.join(data.id);
  if (data.id == this.id) {
    var game = Game.spawn();
    game.id = data.id;
    game.name = data.name;
    games.push(game);

    this.broadcast.emit("new game", {id: data.id, name: data.name});
  } else {
    this.broadcast.to(data.id).emit("join game", {id: this.id})
    var players = gameById(data.id).players;
    for (var i = 0, ii = players.length; i < ii; i++) {
      this.emit("join game", {id: players[i].id})
    }
    gameById(data.id).players.push(playerById(this.id));
  }
}

function onLeaveGame (data) {
  this.leave(data.id);
  var removePlayer = playerById(this.id);
  if (!removePlayer) {
    util.log("Player not found: "+this.id);
    return;
  }
  var gamePlayers = gameById(data.id).players;
  gamePlayers.splice(gamePlayers.indexOf(removePlayer), 1);
  this.broadcast.to(data.id).emit("leave game", {id: this.id})
}
/**************************************************
 ** GAME HELPER FUNCTIONS
 **************************************************/
// Find player by ID
function playerById(id) {
  var i;
  for (i = 0; i < players.length; i++) {
    if (players[i].id == id)
      return players[i];
  }
  return false;
}
function gameById(id) {
  var i;
  for (i = 0; i < games.length; i++) {
    if (games[i].id == id)
      return games[i];
  }
  return false;
}

/**************************************************
 ** RUN THE GAME
 **************************************************/
init();