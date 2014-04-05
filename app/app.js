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
  io = require("../public/node_modules/socket.io/lib/socket.io"),	// Socket.IO
  Player = require("./player").Player;	// Player class


/**************************************************
 ** GAME VARIABLES
 **************************************************/
var socket,	// Socket controller
  players;	// Array of connected players


/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
// Create an empty array to store players
  players = [];

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

// Add new player to the players array
  players.push(newPlayer);
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
  };

  return false;
};


/**************************************************
 ** RUN THE GAME
 **************************************************/
init();