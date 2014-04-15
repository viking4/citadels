define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers", [])
    .controller("LobbyCtrl", ["$scope", "$filter",
      function ($scope, $filter) {
        var socketData = $scope.socketData;
        var socket = $scope.socket;
        var roomName = $scope.$stateParams.roomName;
        var nickname = socketData.localPlayer.nickname;

        $scope.gameLog = "This is the game log\n";
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
            log("You built " + card.name + " type " + card.type + " cost " + card.cost);
            this.ownedDistricts.push(card);
            this.districtHand.splice(this.districtHand.indexOf(card), 1);
            this.gold -= card.cost;
            $scope.buildCap--;
            socket.emit("build", {roomName: roomName, card: card});
          },
          destroyDistrict: function (card) {
            this.ownedDistricts.splice(this.ownedDistricts.indexOf(card), 1);
          }
        };
        socket.on("build", function (data) {
          log("Player " + data.nickname + " has built " + data.card.name + ", Type: " + data.card.type + ", Cost: " + data.card.cost);
        });
        $scope.$watch("localPlayer.districtHand", function (data) {
            socket.emit("district hand", {roomName: roomName, districtHand: $scope.localPlayer.districtHand});
        }, true);
        $scope.$watch("localPlayer.gold", function (data) {
            socket.emit("gold", {roomName: roomName, gold: $scope.localPlayer.gold});
        }, true);
        $scope.$watch("localPlayer.ownedDistricts", function (data) {
            socket.emit("owned districts", {roomName: roomName, ownedDistricts: $scope.localPlayer.ownedDistricts});
        }, true);

        $scope.start = function () {
          var room = socketData.remoteRooms[roomName];
          if (Object.keys(room.players).length   != room.roomCap) {
            log("Not enough players");
          } else {
            log("You has started a game.");
            socket.emit("new game", {roomName: roomName});
            $scope.gameStart = true;
          }
        };
        socket.on("new game", function (data) {
          log("Player " + data.nickname + " has started a game");
          log("You get district cards: " + cardsToString(data.districtHand));
          log("You get " + data.gold + " gold");
          log("The order of players " + orderToString(data.order, data.nickname));

          $scope.players = angular.copy(socketData.remoteRooms[roomName].players);
          delete $scope.players[nickname];

          $scope.localPlayer.gainDistrictHand(data.districtHand);
          $scope.localPlayer.gainGold(data.gold);
          $scope.order = data.order;
          $scope.gameStart = true;

          socket.on("number of district cards", function (data) {
            $scope.players[data.nickname].numberOfDistrictCards = data.numberOfDistrictCards;
          });
          socket.on("gold", function (data) {
            $scope.players[data.nickname].gold = data.gold;
          });
          socket.on("owned districts", function (data) {
            $scope.players[data.nickname].ownedDistricts = data.ownedDistricts;
          });
        });
        socket.on("select character", function (data) {
          $scope.firstRound = false;
          if (data.firstRound) {
            log("New round has begun.");
            $scope.firstRound = true;
            $scope.characters = [];
            $scope.bishopNickname = "";
          }
          if (data.nickname == nickname) {
            log("Player " + nickname + " (You) is choosing characters: " + charactersToString(data.characterDeck));
            $scope.selectCharacter = true;
            $scope.isChoose = true;
            $scope.characterDeck = data.characterDeck;
            if ($scope.firstRound && Object.keys($scope.players).length == 1) {
              $scope.characterDeck.pop();
            }
          } else {
            log("Player " + data.nickname + " is choosing characters");
          }
        });
        var choseChar;
        $scope.chooseCharacter = function (char) {
          log("You have chosen " + char.name);
          choseChar = $scope.characterDeck.splice($scope.characterDeck.indexOf(char), 1)[0];
          $scope.localPlayer.characters[char.rank] = char;
          if ($scope.firstRound) {
            socket.emit("select character", {roomName: roomName, character: char, characterDeck: $scope.characterDeck});
            $scope.selectCharacter = false;
          }
          $scope.isChoose = false;
        };
        $scope.discardCharacter = function (char) {
          log("You have discarded " + char.name);
          $scope.characterDeck.splice($scope.characterDeck.indexOf(char), 1)[0];
          socket.emit("select character", {roomName: roomName, character: choseChar, characterDeck: $scope.characterDeck});
          $scope.selectCharacter = false;
        };
        socket.on("play character", function (data) {
          if (data.character.name == "Bishop") {
            $scope.bishopNickname = data.nickname;
          }
          if (data.nickname == nickname) {
            log("Player " + nickname + " (You) is playing character: " + data.character.name);
            $scope.character = data.character;
            var rank = data.character.rank;
            var actionWatch = $scope.$watch("isBuild", function () {
              if ($scope.isBuild) {
                switch (rank) {
                  case 6:
                    log("As Merchant, you have gained one gold after taking an action");
                    $scope.localPlayer.gainGold(1);
                    break;
                  case 7:
                    socket.emit("architect draw", {roomName: roomName});
                    break;
                }
                actionWatch();
              }
            });
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
              for (var i = 0, ii = $scope.localPlayer.ownedDistricts.length, gold = 0; i < ii; i++) {
                if ($scope.localPlayer.ownedDistricts[i].type == earnDistrictType)
                  gold++;
              }
              if (gold > 0) {
                log("As " + $scope.localPlayer.characters[rank].name + ", you have gained " + gold + " gold from " + gold + " " + earnDistrictType + " districts");
                $scope.localPlayer.gainGold(gold);
              }
            }

            switch ($scope.localPlayer.characters[rank].status) {
              case "murdered":
                log("You cannot do anything since you have been murdered");
                $scope.turnStart = false;
                $scope.murdered = true;
                break;
              case "stolen":
                log("You have been stolen " + $scope.localPlayer.gold + " gold");
                socket.emit("stolen", {gold: $scope.localPlayer.gold});
                $scope.localPlayer.gold = 0;
              default :
                log("starting turn")
                $scope.turnStart = true;
                $scope[data.character.name] = true;
                $scope.isBuild = false;
                $scope.buildCap = 1;
                $scope.chooseOne = false;
                if (rank == 7) {
                  log("You can build 3 districts this turn");
                  $scope.buildCap = 3;
                }
            }
          } else {
            log("Player " + data.nickname + " is playing " + data.character.name);
          }
        });
        socket.on("architect draw", function (cards) {
          log("You got two cards after taking a action: " + cardsToString(cards));
          $scope.localPlayer.gainDistrictHand(cards);
        });
        socket.on("architect draw log", function (nickname) {
          log("Player " + nickname + " the Architect got two cards after taking a action");
        });
        socket.on("stolen", function (gold) {
          if ($scope.localPlayer.characters[2]) {
            log("You have got " + gold + " gold from stealing");
            $scope.localPlayer.gainGold(gold);
          }
        });
        $scope.drawTwoCards = function () {
          log("You choose to draw two cards");
          socket.emit("draw district cards", {roomName: roomName, draw: 2});
        };
        socket.on("draw district cards", function (cards) {
          log("You have drawn " + cards.length + " district cards: " + cardsToString(cards));
          $scope.chooseDiscardCards = cards;
        });

        $scope.murder = function (char) {
          if (char.rank > 0) {
            log("You choose to murder " + char.name);
            socket.emit("murder", {roomName: roomName, character: char});
          }
          $scope.Assassin = false;
        };
        socket.on("murder", function (char) {
          $scope.murderVictim = char;
          if ($scope.localPlayer.characters[char.rank]) {
            log("As " + char.name + ", you will be murdered on your turn");
            $scope.localPlayer.characters[char.rank].status = "murdered";
          } else {
            log("The Assassin chooses to murder " + char.name);
          }
        });
        $scope.steal = function (char) {
          if (char.rank > 0) {
            log("You choose to steal from " + char.name);
            socket.emit("steal", {roomName: roomName, character: char});
          }
          $scope.Thief = false;
        };
        socket.on("steal", function (char) {
          if ($scope.localPlayer.characters[char.rank]) {
            log("As " + char.name + ", you will stolen at the start of your turn");
            $scope.localPlayer.characters[char.rank].status = "stolen";
          } else {
            log("The Thief has stolen from " + char.name);
          }
        });
        $scope.exchange = function (player) {
          if (player) {
            log("You choose to exchange your hand with " + player.nickname);
            socket.emit("exchange", {roomName: roomName, player: player, districtHand: $scope.localPlayer.districtHand});
            $scope.localPlayer.districtHand = [];
          } else {
            log("You choose to exchange " + $scope.noOfExchangeCards + " of your cards with the deck");
            socket.emit("exchange", {roomName: roomName, noOfExchangeCards: $scope.noOfExchangeCards});
          }
          $scope.Magician = false;
        };
        socket.on("exchange", function (cards) {
          log("Your district hand is " + cardsToString(cards) + " after the exchange");
          $scope.localPlayer.gainDistrictHand(cards);
        });
        socket.on("exchanged", function (data) {
          if ($scope.localPlayer.nickname == data.nickname) {
            log("You got exchanged, now your district hand is " + cardsToString(data.cards));
            $scope.localPlayer.districtHand = data.cards;
          } else {
            log("Player " + data.nickname + " is being exchanged cards");
          }
        });
        $scope.checkNoOfExchangeCards = function () {
          if ($scope.noOfExchangeCards > 0 && $scope.noOfExchangeCards < $scope.localPlayer.districtHand.length) {
            log("You need to choose cards to discard");
            $scope.chooseExchangeCards = true;
            $scope.exchangeCount = 0;
          } else if ($scope.noOfExchangeCards == $scope.localPlayer.districtHand.length) {
            $scope.localPlayer.districtHand = [];
            $scope.exchange();
            $scope.Magician = false;
          } else if ($scope.noOfExchangeCards == 0) {
            log("You skipped exchange");
            $scope.Magician = false;
          } else {
            log("Invalid number of cards to exchange");
          }

        };
        $scope.discardCardToExchange = function (card) {
          $scope.localPlayer.districtHand.splice($scope.localPlayer.districtHand.indexOf(card), 1);
          $scope.exchangeCount++;
          log("Discarded"+ card.name + " " + $scope.exchangeCount + "/" + $scope.noOfExchangeCards + " cards");
          if ($scope.noOfExchangeCards == $scope.exchangeCount) {
            $scope.exchange();
            $scope.Magician = false;
          }
        };
        $scope.destroy = function (player, card) {
          socket.emit("destroy", {roomName: roomName, player: player, card: card});
          $scope.Warlord = false;
        };
        socket.on("destroy", function (data) {
          if (data.nickname == nickname) {
            log("The Warlord has destroyed your district " + data.card.name);
            $scope.localPlayer.destroyDistrict(data.card);
          } else {
            log("The Warlord has destroyed the district " + data.card.name + " of " + data.nickname);
          }
        });
        $scope.endTurn = function () {
          log("Your turn has ended");
          $scope.turnStart = false;
          $scope.isBuild = false;
          $scope[$scope.character.name] = false;
          $scope.murdered = false;
          socket.emit("play character", {roomName: roomName});
        };
        socket.on("game end this round", function (data) {
          log("Player " + data.nickname + " has at least 8 districts. The game will end this round");
        });
        socket.on("game end", function (data) {
          log("The winner is " + data.winner.nickname);
        });
        $scope.leave = function () {
          socket.emit("leave room", {roomName: roomName});
          delete $scope.players[nickname];
          log("Player " + nickname + " has left room " + roomName);
          if (Object.keys($scope.players).length == 0) {
            delete $scope.socketData.remoteRooms[roomName];
            log("Room " + roomName + " has been destroyed")
          }
          $scope.$state.go("main");
        };
        $scope.chat = function () {
          socket.emit("chat", {roomName: roomName, chat: $scope.chatInput});
          $scope.chatInput = "";
        };
        socket.on("chat", function (data) {
          $scope.chatLog += data.nickname + ": " + data.chat + "\n";
        });
        function log(str) {
          $scope.gameLog += $filter('date')(new Date(), 'mediumTime') + ": " + str + "\n";
        }
        function cardsToString (cards) {
          for (var i = 0, ii = cards.length, str = ""; i < ii; i++) {
            str += cards[i].name + ", ";
          }
          return str.slice(0, -2);
        }
        function charactersToString (chars) {
          for (var i = 0, ii = chars.length, str = ""; i < ii; i++) {
            str += chars[i].name + ", ";
          }
          return str.slice(0, -2);
        }
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
