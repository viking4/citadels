define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.gameCtrl", [])
    .controller("GameCtrl", ["$scope", "$rootScope", "gameFactory",
      function ($scope, $rootScope, game) {
        var app = $scope.app;
        var socket = $scope.socket;
        var roomName = game.roomName;
        var nickname = game.nickname;

        $scope.start = function () {
          var room = app.remoteRooms[roomName];
          if (Object.keys(room.players).length != room.roomCap) {
            game.log("Not enough players");
          } else {
            game.log("You has started a game.");
            socket.emit("new game", {roomName: roomName});
            $scope.gameStart = true;
          }
        };
        socket.on("new game", function (data) {
          game.log(data.nickname + " has started a game");
          game.log("You get district cards: " + game.cardsToString(data.districtHand));
          game.log("You get " + data.gold + " gold");
          game.log("The order of players " + orderToString(data.order, data.nickname));

          delete game.players[nickname];

          game.districtHand = data.districtHand;
          game.gold = data.gold;
          game.order = data.order;

          $scope.gameStart = true;
        });
        socket.on("play character", function (data) {
          if (data.character.name == "Bishop") {
            game.bishopNickname = data.nickname;
          }
          if (nickname == data.nickname) {
            var rank = data.character.rank;

            switch (game.characters[rank].status) {
              case "murdered":
                game.log("You cannot do anything since you have been murdered");
                game.onTurn = false;
                $scope.murdered = true;
                break;
              case "stolen":
                game.log("You have been stolen " + game.gold + " gold");
                socket.emit("stolen", {gold: game.gold});
                game.gold = 0;
              default :
                game.log("Starting your turn as the " + data.character.name);
                game.currentCharacter = data.character;
                game.onTurn = true;
                game[data.character.name] = true;
                game.calculateIncome();
                game.checkSpecialCards();

                if (rank == 7) {
                  game.log("You can build 3 districts this turn");
                  game.buildCap = 3;
                }

            }
          } else {
            game.log(data.nickname + " is playing " + data.character.name);
            if (game.murderVictim && game.murderVictim.rank == data.character.rank) {
              game.log("The " + data.character.name + " has been murdered");
            }
          }
        });
        $scope.collectIncome = function () {
          game.gainGold(game.income);
          $scope.collected = true;
          socket.emit("gold character", {roomName: game.roomName, character: game.currentCharacter, gold: game.income});
          game.log("As the " + game.currentCharacter.name + ", you have gained " + game.income + " gold from your districts");
        };
        socket.on("gold character", function (data) {
          game.log("As the " + data.character.name + ", " + data.nickname + " has gained " + data.gold + " gold from " + data.gold + " districts");
        });

        $scope.endTurn = function () {
          game.onTurn = false;
          game.buildTurn = false;
          game[game.currentCharacter.name] = false;
          game.currentCharacter = {};
          game.buildCap = 1;

          game.SchoolOfMagic = false;
          game.Laboratory = false;
          game.Smithy = false;

          $scope.collected = false;
          $scope.murdered = false;

          if (game.ownedDistricts["School of Magic"])
            game.ownedDistricts["School of Magic"].type = "Special";

          socket.emit("play character", {roomName: roomName});
          game.log("Your turn has ended");
        };
        socket.on("game end this round", function (data) {
          game.log(data.nickname + " has at least 8 districts. The game will end this round");
        });
        socket.on("game end", function (data) {
          $scope.gameEnd = true;
          $scope.final = data.final;
          $scope.winner = data.winner;
          game.log("The winner is " + data.winner.nickname);
        });
        $scope.leave = function () {
          socket.emit("leave room", {roomName: roomName});
        };
        socket.on("leave room", function (data) {
          var room = app.remoteRooms[data.roomName];
          delete room.players[data.player.nickname];
          room.numberOfPlayers = Object.keys(room.players).length;
          if (Object.keys(app.remoteRooms[data.roomName].players).length == 0) {
            delete app.remoteRooms[data.roomName];
          }
          if (nickname = data.player.nickname) {
            $scope.$state.go("main");
          } else {
            game.log(data.player.nickname + " left room");
          }
        });

        $scope.$watch("game.gold", function (data) {
          socket.emit("gold", {roomName: roomName, gold: data});
        }, true);
        $scope.$watch("game.ownedDistricts", function (data) {
          game.calculateIncome();
          socket.emit("owned districts", {roomName: roomName, ownedDistricts: data});
        }, true);
        $scope.$watch("game.districtHand", function (data) {
          socket.emit("district hand", {roomName: roomName, districtHand: data});
        }, true);

        $scope.socket.on("gold", function (data) {
          game.players[data.nickname].gold = data.gold;
        });
        $scope.socket.on("owned districts", function (data) {
          game.players[data.nickname].ownedDistricts = data.ownedDistricts;
        });
        $scope.socket.on("district hand", function (data) {
          game.players[data.nickname].numberOfDistrictCards = data.number;
        });

        $scope.$on('$destroy', function (event) {
          socket.removeAllListeners();
        });
        function orderToString(order, king) {
          for (var i = 0, ii = order.length, preKing = "", postKing = ""; i < ii; i++) {
            var name = order[i].nickname;
            if (name == king || postKing != "")
              postKing += name + ", ";
            else
              preKing += name + ", ";
          }
          return (postKing + preKing).slice(0, -2);
        }
      }])
});