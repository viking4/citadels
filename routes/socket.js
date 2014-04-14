/*
 * Serve content over a socket
 */
var util = require("util"),	// Utility resources (logging, object inspection, etc)
  Player = require("../app/player").Player,
  Game = require("../app/game").Game;

module.exports = function(io) {
  var players = {}, games = {};

  io.sockets.on('connection', onConnection);

  function onConnection(client) {
    util.log("New client has connected: "+client.id);

    client.on("disconnect", onClientDisconnect);

    client.on("new client", onNewClient);
    client.on("new player", onNewPlayer);
    client.on("remove player", onRemovePlayer);
    client.on("join room", onJoinRoom);
    client.on("leave room", onLeaveRoom);

    client.on("new game", onNewGame);
    client.on("select character", onSelectCharacter);
    client.on("play character", onPlayCharacter);
    client.on("draw district cards", onDrawDistrictCards);

    client.on("murder", onMurder);
    client.on("steal", onSteal);
    client.on("stolen", onStolen);
    client.on("exchange", onExchange);
    client.on("architect draw", onArchitectDraw);

    client.on("gold", onGold);
    client.on("owned districts", onOwnedDistricts);
    client.on("district hand", onDistrictHand);

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
    function onNewPlayer(data) {
      var newPlayer = new Player(this.id, data.nickname);
      this.broadcast.emit("new player", newPlayer);
      var roomKeys = Object.keys(io.sockets.manager.rooms);
      for (var i = 0, ii = roomKeys.length; i < ii; i++) {
        if (roomKeys[i] != "") {
          var roomName = roomKeys[i].substring(1);
          var roster = io.sockets.clients(roomName);
          for (i = 0, ii = roster.length; i < ii; i++) {
            var player = playerById(roster[i].id);
            this.emit("join room", {roomName: roomName, player: player});
          }
        }
      }
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
      var roster = io.sockets.clients(data.roomName);
      var hostPlayer = playerById(this.id);
      var order = [];
      for (var i = 0, ii = roster.length; i < ii; i++) {
        var player = playerById(roster[i].id);
        order.push({id: player.id, nickname: player.nickname});
      }
      var game = new Game(order);
      game.setKing(hostPlayer.nickname);
      game.districtDeck.shuffle();
      util.log("A player has started a game");
      for ( i = 0, ii = roster.length; i < ii; i++) {
        var cards = game.districtDeck.draw(4);
        player = playerById(roster[i].id);
        player.setGold(2);
        player.setDistrictHand(cards);
        roster[i].emit("new game", {nickname: hostPlayer.nickname, gold: 2, districtHand: cards, order: order});
      }
      game.characterDeck.shuffle();
      this.emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck});
      this.broadcast.to(data.roomName).emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck});
      games[data.roomName] = game;
    }
    function onSelectCharacter (data) {
      var game = games[data.roomName];
      game.selectCharacter(this.id, data.character);
      if (data.characterDeck.length > 0) {
        this.broadcast.to(data.roomName).emit("select character", {nickname: game.playerAfter(this.id), characterDeck: data.characterDeck});
      } else {
        var nextPlayer = game.getNextPlayer();
        this.emit("play character", nextPlayer);
        this.broadcast.to(data.roomName).emit("play character", nextPlayer);
      }
    }
    function onPlayCharacter (data) {
      var game = games[data.roomName];
      var nextPlayer = game.getNextPlayer();
      if (nextPlayer.nickname) {
        this.emit("play character", nextPlayer);
        this.broadcast.to(data.roomName).emit("play character", nextPlayer);
        if (nextPlayer.character.rank == 4) {
          game.setKing(nextPlayer.nickname);
        }
      } else {
        game.characterDeck.shuffle();
        this.emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck});
        this.broadcast.to(data.roomName).emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck});
      }
    }
    function onDrawDistrictCards (data) {
      var cards = games[data.roomName].districtDeck.draw(data.draw);
      this.emit("draw district cards", cards);
    }
    function onMurder (data) {
      this.broadcast.to(data.roomName).emit("murder", data.character);
    }
    function onSteal (data) {
      this.broadcast.to(data.roomName).emit("steal", data.character);
    }
    function onStolen (data) {
      this.broadcast.to(data.roomName).emit("stolen", data.gold);
    }
    function onExchange (data) {
      if (data.player) {
        var exchangePlayer = playerById(this.id);
        var exchangedPlayer = playerById(data.player.id);
        this.emit("exchange", exchangedPlayer.districtHand);
        this.broadcast.to(data.roomName).emit("exchanged", {nickname: data.player.nickname, cards: exchangePlayer.districtHand});
      } else {
        var cards = games[data.roomName].districtDeck.draw(data.noOfExchangeCards);
        this.emit("exchange", cards);
      }
    }
    function onArchitectDraw (data) {
      var cards = games[data.roomName].districtDeck.draw(2);
      this.emit("architect draw", cards);
      this.broadcast.to(data.roomName).emit("architect draw log", playerById(this.id).nickname);
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
    function playerById(id) {
      var keys = Object.keys(players);
      for (var i = 0, ii = keys.length; i < ii; i++) {
        var player = players[keys[i]];
        if (player.id == id)
          return player;
      }
      return false;
    }
    function roomById(id) {
      var rooms = Object.keys(io.sockets.manager.roomClients[id]);
      for (var i = 0, ii = rooms.length; i < ii; i++){
        if (rooms[i] != "") {
          return rooms[i].substring(1);
        }
      }
    }
  }
};