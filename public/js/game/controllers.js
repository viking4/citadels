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
          characters: {},
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
            $scope.buildCap--;
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
          $scope.localPlayer.gainDistrictHand(data.districtHand);
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
            if ($scope.characterDeck.length == 8 && Object.keys($scope.players).length == 1) {
              $scope.characterDeck.pop();
              $scope.firstRound = true;
            }
          }
        });

        var char;
        $scope.chooseCharacter = function (rank) {
          for (var i = 0, ii = $scope.characterDeck.length; i < ii; i++) {
            if ($scope.characterDeck[i].rank == rank) {
              char = $scope.characterDeck.splice(i, 1)[0];
              $scope.localPlayer.characters[rank] = char;
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
        $scope.endTurn = function () {
          $scope.turnStart = false;
          socket.emit("play character", {roomName: roomName});
        };
        socket.on("play character", function (data) {
          if (data.nickname == nickname) {
            var actionWatch = $scope.$watch("isBuild", function () {
              if ($scope.isBuild) {
                switch (data.rank) {
                  case 6:
                    $scope.localPlayer.gainGold(1);
                    break;
                  case 7:
                    socket.emit("architect draw");
                    break;
                }
                actionWatch();
              }
            });
            var earnDistrictType;
            switch (data.rank) {
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
              for (var i = 0, ii = $scope.localPlayer.ownedDistricts.length, gold = 0; i < ii; i++) {
                if ($scope.localPlayer.ownedDistricts[i].type == earnDistrictType)
                  gold++;
              }
              if (gold > 0)
                $scope.localPlayer.gainGold(gold);
            }

            switch ($scope.localPlayer.characters[data.rank].status) {
              case "murdered":
                $scope.turnStart = false;
                break;
              case "stole":
                socket.emit("stole", $scope.localPlayer.gold);
                $scope.localPlayer.gold = 0;
              default :
                $scope.turnStart = true;
                $scope["rank"+data.rank] = true;
                $scope.isBuild = false;
                $scope.buildCap = 1;
                $scope.chooseOne = false;
                if (data.rank == 7)
                  $scope.buildCap = 3;
            }
          }
        });
        socket.on("stole", function (gold) {
          if ($scope.localPlayer.characters[2]) {
            $scope.localPlayer.gainGold(gold);
          }
        });

        $scope.drawTwoCards = function () {
          socket.emit("draw district cards", {roomName: roomName, draw: 2});
        };
        socket.on("draw district cards", function (cards) {
          $scope.chooseDiscardCards = cards;
        });

        $scope.murder = function (rank) {
          if (rank > 0) {
            socket.emit("murder", {roomName: roomName, rank: rank});
          }
        };
        socket.on("murder", function (rank) {
          $scope.murderVictimRank = rank;
          if ($scope.localPlayer.characters[rank]) {
            $scope.localPlayer.characters[rank].status = "murdered";
          }
        });

        $scope.steal = function (rank) {
          if (rank > 0) {
            socket.emit("steal", {roomName: roomName, rank: rank});
          }
        };
        socket.on("steal", function (rank) {
          if ($scope.localPlayer.characters[rank]) {
            $scope.localPlayer.characters[rank].status = "stole";
          }
        });

        $scope.exchange = function (id) {
          if (id) {
            socket.emit("exchange", {roomName: roomName, id: id, districtHand: $scope.localPlayer.districtHand});
          } else {
            socket.emit("exchange", {roomName: roomName, noOfExchangeCards: $scope.noOfExchangeCards});
          }
        };
        $scope.checkNoOfExchangeCards = function () {
          if ($scope.noOfExchangeCards > 0 && $scope.noOfExchangeCards <= $scope.localPlayer.districtHand.length) {
            $scope.chooseExchangeCards = true;
            $scope.exchangeCount = 0;
          }
          if ($scope.noOfExchangeCards == 0)
            $scope.rank3 = false;
        };
        $scope.exchangeCard = function (card) {
          this.districtHand.splice(this.districtHand.indexOf(card), 1);
          $scope.exchangeCount++;
          if ($scope.noOfExchangeCards == $scope.exchangeCount) {
            $scope.exchange();
            $scope.rank3 = false;
          }
        };
        socket.on("exchange", function (hand) {
          $scope.localPlayer.districtHand = hand;
        });
        socket.on("exchanged", function (data) {
          if ($scope.localPlayer.nickname == data.nickname) {
            $scope.localPlayer.gainDistrictHand(data.districtHand);
          }
        });
        socket.on("architect draw", function (hand) {
          $scope.localPlayer.gainDistrictHand(hand);
        });

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
