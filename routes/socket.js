/*
 * Serve content over a socket
 */
var util = require("util"),	// Utility resources (logging, object inspection, etc)
  Player = require("../app/player").Player,
  Game = require("../app/game").Game;

module.exports = function(io) {
  var players = {}, games = {}, rooms = {};

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
    client.on("build", onBuild);

    client.on("murder", onMurder);
    client.on("steal", onSteal);
    client.on("stolen", onStolen);
    client.on("exchange", onExchange);
    client.on("architect draw", onArchitectDraw);
    client.on("destroy", onDestroy);

    client.on("gold", onGold);
    client.on("owned districts", onOwnedDistricts);
    client.on("district hand", onDistrictHand);

    client.on("chat", onChat);
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
            this.emit("join room", {roomName: roomName, player: player, roomCap: rooms[roomName].roomCap});
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
      if (data.roomCap) {
        rooms[data.roomName] = {roomCap: data.roomCap};
      }
      this.join(data.roomName);
      util.log("A player joins room: "+data.roomName);
      var joinPlayer = playerById(this.id);
      this.emit("join room", {roomName: data.roomName, player: joinPlayer, roomCap: data.roomCap});
      this.broadcast.emit("join room", {roomName: data.roomName, player: joinPlayer, roomCap: data.roomCap});
    }

    function onLeaveRoom (data) {
      var leavePlayer = playerById(this.id);
      this.leave(data.roomName);
      util.log("A player leaves room: "+leavePlayer.roomName);
      this.emit("leave room", {roomName: data.roomName, player: leavePlayer});
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
      this.emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck, firstRound: true});
      this.broadcast.to(data.roomName).emit("select character", {nickname: game.king, firstRound: true});
      games[data.roomName] = game;
    }
    function onSelectCharacter (data) {
      var game = games[data.roomName];
      game.selectCharacter(this.id, data.character);
      if (data.characterDeck.length > 0) {
        this.emit("select character", {nickname: game.playerAfter(this.id)});
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
      } else if (!game.isEnded()){
        game.characterDeck.shuffle();
        this.emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck, firstRound: true});
        this.broadcast.to(data.roomName).emit("select character", {nickname: game.king, characterDeck: game.characterDeck.deck, firstRound: true});
      } else {
        var roster = io.sockets.clients(data.roomName);
        var winner = {totalPoints: 0};
        var final = [];
        for (var i = 0, ii = roster.length; i < ii; i++) {
          var player = playerById(roster[i].id);
          var types = ["Noble", "Religious", "Trade", "Military", "Special"];
          for (var j = 0, jj = player.ownedDistricts.length; j < jj; j++) {
            player.districtPoints += player.ownedDistricts[j].cost;
            types.slice(types.indexOf(player.ownedDistricts[j].type), 1);
          }
          if (types.length == 0)
            player.fiveColorPoints = 3;
          if (player.nickname == game.ender) {
            player.enderPoints = 4;
          } else if (player.ownedDistricts.length >= 8) {
            player.eightDistrictPoints = 2;
          }
          player.totalPoints = player.districtPoints + player.fiveColorPoints + player.enderPoints + player.eightDistrictPoints;
          final.push(player);
          if (player.totalPoints > winner.totalPoints ||
            player.totalPoints == winner.totalPoints && player.districtPoints > winner.districtPoints ||
            player.totalPoints == winner.totalPoints && player.districtPoints == winner.districtPoints && player.gold > winner.gold) {
              winner = player;
          }
        }
        this.emit("game end", {winner: winner, final: final});
        this.broadcast.to(data.roomName).emit("game end", {winner: winner, final: final});
      }
    }
    function onDrawDistrictCards (data) {
      var cards = games[data.roomName].districtDeck.draw(data.draw);
      this.emit("draw district cards", cards);
    }
    function onBuild (data) {
      this.broadcast.to(data.roomName).emit("build", {nickname: playerById(this.id).nickname, card: data.card});
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
    function onDestroy (data) {
      this.broadcast.to(data.roomName).emit("destroy", {nickname: data.player.nickname, card: data.card});
    }

    function onGold (data) {
      var player = playerById(this.id);
      if (player) {
        player.setGold(data.gold);
        this.broadcast.to(data.roomName).emit("gold", {nickname: player.nickname, gold: player.gold})
      }
    }
    function onDistrictHand (data) {
      var player = playerById(this.id);
      if (player) {
        player.setDistrictHand(data.districtHand);
        this.broadcast.to(data.roomName).emit("number of district cards", {nickname: player.nickname, numberOfDistrictCards: data.districtHand.length});
      }
    }
    function onOwnedDistricts (data) {
      var player = playerById(this.id);
      if (player) {
        player.setOwnedDistricts(data.ownedDistricts);
        this.broadcast.to(data.roomName).emit("owned districts", {nickname: player.nickname, ownedDistricts: data.ownedDistricts});
        var game = games[data.roomName];
        if (data.ownedDistricts.length >= 8 && !game.isEnded()) {
          game.ender = player;
          this.emit("game end this round", {nickname: player.nickname});
          this.broadcast.to(data.roomName).emit("game end this round", {nickname: player.nickname});
        }
      }
    }
    function onChat (data) {
      var player = playerById(this.id);
      if (player) {
        this.emit("chat", {nickname: player.nickname, chat: data.chat});
        this.broadcast.to(data.roomName).emit("chat", {nickname: player.nickname, chat: data.chat});
      }
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