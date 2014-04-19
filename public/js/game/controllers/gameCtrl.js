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

          var keys = Object.keys(game.players);
          for (var i = 0, ii = keys.length; i < ii; i++) {
            angular.extend(game.players[keys[i]], {
              gold: data.gold,
              numberOfDistrictCards: data.districtHand.length
            });
          }
          $scope.gameStart = true;
        });
        socket.on("play character", function (data) {
          if (data.character.name == "Bishop") {
            game.bishopNickname = data.nickname;
          }
          if (nickname == data.nickname) {
            game.log(nickname + " (You) is playing character: " + data.character.name);
            game.currentCharacter = data.character;
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
                game.onTurn = true;
                game[data.character.name] = true;
                game.buildTurn = false;
                game.buildCap = 1;

                if (rank == 7) {
                  game.log("You can build 3 districts this turn");
                  game.buildCap = 3;
                }
            }
            var earnDistrictType;
            switch (rank) {
              case 4:
                earnDistrictType = "Noble";
                break;
              case 5:
                earnDistrictType = "Religious";
                break;
              case 6:
                earnDistrictType = "Trade";
                break;
              case 8:
                earnDistrictType = "Military";
                break;
            }
            if (earnDistrictType) {
              for (var i = 0, ii = game.ownedDistricts.length, gold = 0; i < ii; i++) {
                if (game.ownedDistricts[i].type == earnDistrictType)
                  gold++;
                if (game.ownedDistricts[i].name == "School of Magic") {
                  $scope.SchoolOfMagic = true;
                  game.log("You can choose the color of your \"School of Magic\"");
                }
              }
              if (gold > 0) {
                game.gainGold(gold);
                game.log("As the " + data.character.name + ", you have gained " + gold + " gold from " + gold + " " + earnDistrictType + " districts");
                socket.emit("gold character", {roomName: roomName, character: data.character, gold: gold});
              }
            }
          } else {
            game.log(data.nickname + " is playing " + data.character.name);
            if (game.murderVictim && game.murderVictim.rank == data.character.rank) {
              game.log("The " + data.character.name + " has been murdered");
            }
          }
        });
        socket.on("gold character", function (data) {
          game.players[data.nickname].gold += data.gold;
          game.log("As the " + data.character.name + ", " + data.nickname + " has gained " + data.gold + " gold from " + data.gold + " districts");
        });

        $scope.endTurn = function () {
          game.log("Your turn has ended");
          game.onTurn = false;
          game.buildTurn = false;
          game[game.currentCharacter.name] = false;
          game.currentCharacter = {};
          $scope.murdered = false;
          socket.emit("play character", {roomName: roomName});
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
          socket.emit("gold", {gold: data});
        }, true);
        $scope.$watch("game.ownedDistricts", function (data) {
          socket.emit("owned districts", {roomName: roomName, ownedDistricts: data});
        }, true);
        $scope.$watch("game.districtHand", function (data) {
          socket.emit("district hand", {districtHand: data});
        }, true);

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