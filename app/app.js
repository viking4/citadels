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
      this.emit("new room", {roomName: roomName});
    }
  }
// Add new player to the players array
  util.log("New player has been created: "+this.id);
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
  var players = [];
  for (var i = 0, ii = roster.length; i < ii; i++) {
    var player = playerById(roster[i].id);
    players.push(player);
  }
  var newGame = new Game(players);
  this.emit("new game", newGame);
  this.broadcast.emit("new game", newGame);
  games[data.roomName] = newGame;
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