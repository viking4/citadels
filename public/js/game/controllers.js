define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers", [])
    .controller("LobbyCtrl", ["$scope",
      function ($scope) {
        var socketData = $scope.socketData;
        var socket = $scope.socket;
        var roomName = $scope.$stateParams.roomName;
        var nickname = socketData.localPlayer.nickname;
        $scope.players = socketData.remoteRooms[roomName].players;
        $scope.localPlayer = {
          nickname: nickname,
          characters: [],
          gold: 0,
          districtHand: [],
          ownedDistricts: [],
          gainGold: function (gold) {
            this.gold += gold;
          },
          gainDistrictHand: function (cards) {
            this.districtHand = this.districtHand.concat(cards);
          },
          buildDistrict: function (card) {
            this.ownedDistricts.push(card);
            this.districtHand.splice(this.districtHand.indexOf(card), 1);
            this.gold -= card.cost;
          }
        };

        $scope.$watch("localPlayer.districtHand", function () {
          socket.emit("district hand", {roomName: roomName, districtHand: $scope.localPlayer.districtHand});
        }, true);
        $scope.$watch("localPlayer.gold", function () {
          socket.emit("gold", {roomName: roomName, gold: $scope.localPlayer.gold});
        }, true);
        $scope.$watch("localPlayer.ownedDistricts", function () {
          socket.emit("owned districts", {roomName: roomName, ownedDistricts: $scope.localPlayer.ownedDistricts});
        }, true);

        socket.on("number of district cards", function (data) {
          $scope.players[data.nickname].numberOfDistrictCards = data.numberOfDistrictCards;
        });
        socket.on("gold", function (data) {
          $scope.players[data.nickname].gold = data.gold;
        });
        socket.on("owned districts", function (data) {
          $scope.players[data.nickname].ownedDistricts = data.ownedDistricts;
        });

        $scope.start = function () {
          socket.emit("new game", {roomName: roomName})
        };
        socket.on("new game", function (data) {
          $scope.localPlayer.gainDistrictHand(data.hand);
          $scope.localPlayer.gainGold(data.gold);
          $scope.order = data.order;
          $scope.gameStart = true;
        });
        socket.on("select character", function (data) {
          if (data.nickname == nickname) {
            $scope.selectCharacter = true;
            $scope.isChoose = true;
            $scope.firstRound = false;

            $scope.characterDeck = data.characterDeck;
            if ($scope.characterDeck.length == 8 && Object.keys($scope.players) == 1) {
              $scope.characterDeck.pop();
              $scope.firstRound = true;
            }
          } else {
            $scope.selectCharacter = false;
          }
        });
        var char;
        $scope.chooseCharacter = function (rank) {
          for (var i = 0, ii = $scope.characterDeck.length; i < ii; i++) {
            if ($scope.characterDeck[i].rank == rank) {
              char = $scope.characterDeck.splice(i, 1)[0];
              $scope.localPlayer.characters.push(char);
              if ($scope.firstRound) {
                socket.emit("select character", {roomName: roomName, character: char, characterDeck: $scope.characterDeck});
                $scope.selectCharacter = false;
              }
              $scope.isChoose = false;
              break;
            }
          }
        };
        $scope.discardCharacter = function (rank) {
          var deck = $scope.characterDeck;
          for (var i = 0, ii = deck.length; i < ii; i++) {
            if (deck[i].rank == rank) {
              $scope.characterDeck.splice(i, 1);
              socket.emit("select character", {roomName: roomName, character: char, characterDeck: $scope.characterDeck});
              $scope.selectCharacter = false;
              break;
            }
          }
        };

        socket.on("play character", function (data) {
          if (data.nickname == nickname) {
            $scope.turnStart = true;
            $scope["rank"+data.rank] = true;
            $scope.isBuild = false;
            $scope.buildCap = 1;
            if (data.rank == 7) {
              $scope.buildCap = 2;
            }
            $scope.chooseOne = false;
          }
        });

        $scope.drawTwoCards = function () {
          socket.emit("draw district cards", {roomName: roomName, draw: 2});
        };
        socket.on("draw district cards", function (cards) {
          $scope.chooseDiscardCards = cards;
        });


        $scope.murder = function (rank) {

        };
        $scope.steal = function (rank) {

        };
        $scope.exchange = function (nickname) {

        };

        $scope.leave = function () {
          socket.emit("leave room", {roomName: roomName});
          delete $scope.players[nickname];
          console.log(nickname + " has left " + roomName);
          if (Object.keys($scope.players).length == 0) {
            delete $scope.socketData.remoteRooms[roomName];
            console.log(roomName + " has been destroyed")
          }
          $scope.$state.go("main");
        };
    }]);
});
