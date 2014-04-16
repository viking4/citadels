define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers", [])
    .controller("LobbyCtrl", ["$scope", "$filter", "$rootScope",
      function ($scope, $filter, $rootScope) {
        var socketData = $scope.socketData;
        var socket = $scope.socket;
        var roomName = $scope.$stateParams.roomName;
        var nickname = socketData.localPlayer.nickname;

        var playersWatch = $rootScope.$watch("socketData.remoteRooms", function () {
          if (socketData.remoteRooms[roomName]) {
            $scope.players = angular.copy(socketData.remoteRooms[roomName].players);
            delete $scope.players[nickname];
          }
        }, true);

        $rootScope.$on('$stateChangeStart',
          function(event, toState, toParams, fromState, fromParams) {
            playersWatch();
          });
        $scope.gameLog = "This is the game log\n";
        $scope.localPlayer = {
          nickname: nickname,
          characters: {},
          currCharacter: {},
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
            var index = this.ownedDistricts.indexOf(card);
            if (index != -1)
              this.ownedDistricts.splice(index, 1);
          },
          setHauntedCityAttr: function (attr, value) {
            for (var i = 0, ii = this.ownedDistricts.length; i < ii; i++) {
              if (this.ownedDistricts[i].name == "Haunted City") {
                this.ownedDistricts[i][attr] = value;
              }
            }
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

        socket.on("number of district cards", function (data) {
          if ($scope.players)
            $scope.players[data.nickname].numberOfDistrictCards = data.numberOfDistrictCards;
        });
        socket.on("gold", function (data) {
          if ($scope.players)
            $scope.players[data.nickname].gold = data.gold;
        });
        socket.on("owned districts", function (data) {
          if ($scope.players)
            $scope.players[data.nickname].ownedDistricts = data.ownedDistricts;
        });

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

          $scope.localPlayer.gainDistrictHand(data.districtHand);
          $scope.localPlayer.gainGold(data.gold);
          $scope.order = data.order;
          $scope.gameStart = true;
        });
        socket.on("select character", function (data) {
          $scope.firstRound = false;
          if (data.firstRound) {
            log("New round has begun.");
            $scope.firstRound = true;
            $scope.localPlayer.characters = {};
            $scope.bishopNickname = "";
            $scope.localPlayer.setHauntedCityAttr("value", true);
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
        var chosenChar;
        $scope.chooseCharacter = function (char) {
          log("You have chosen " + char.name);
          chosenChar = $scope.characterDeck.splice($scope.characterDeck.indexOf(char), 1)[0];
          $scope.localPlayer.characters[char.rank] = char;
          if ($scope.firstRound) {
            log("Remaining characters: " + charactersToString($scope.characterDeck));
            socket.emit("select character", {roomName: roomName, character: char, characterDeck: $scope.characterDeck});
            $scope.selectCharacter = false;
          }
          $scope.isChoose = false;
        };
        $scope.discardCharacter = function (char) {
          $scope.characterDeck.splice($scope.characterDeck.indexOf(char), 1)[0];
          log("You have discarded " + char.name + ". Remaining characters: " + charactersToString($scope.characterDeck));
          socket.emit("select character", {roomName: roomName, character: chosenChar, characterDeck: $scope.characterDeck});
          $scope.selectCharacter = false;
        };
        socket.on("play character", function (data) {
          if (data.character.name == "Bishop") {
            $scope.bishopNickname = data.nickname;
          }
          if (data.nickname == nickname) {
            log("Player " + nickname + " (You) is playing character: " + data.character.name);
            $scope.localPlayer.currCharacter = data.character;
            var rank = data.character.rank;

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
                log("Starting your turn as the " + data.character.name);
                $scope.turnStart = true;
                $scope[data.character.name] = true;
                $scope.hideTwoGold = false;
                $scope.isBuild = false;
                $scope.buildCap = 1;
                $scope.chooseOne = false;
                $scope.chooseExchangeCards = false;
                if (rank == 7) {
                  log("You can build 3 districts this turn");
                  $scope.buildCap = 3;
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
              for (var i = 0, ii = $scope.localPlayer.ownedDistricts.length, gold = 0; i < ii; i++) {
                if ($scope.localPlayer.ownedDistricts[i].type == earnDistrictType)
                  gold++;
              }
              if (gold > 0) {
                log("As the " + $scope.localPlayer.characters[rank].name + ", you have gained " + gold + " gold from " + gold + " " + earnDistrictType + " districts");
                $scope.localPlayer.gainGold(gold);
              }
            }
          } else {
            log("Player " + data.nickname + " is playing " + data.character.name);
            if ($scope.murderVictim && $scope.murderVictim.rank == data.character.rank) {
              log("The " + data.character.name + " has been murdered");
            }
          }
        });
        socket.on("stolen", function (gold) {
          if ($scope.localPlayer.characters[2]) {
            log("You have got " + gold + " gold from stealing");
            $scope.localPlayer.gainGold(gold);
          }
        });
        function checkAfterAction() {
          switch ($scope.localPlayer.currCharacter.rank) {
            case 6:
              log("As the Merchant, you have gained one gold after taking an action");
              $scope.localPlayer.gainGold(1);
              break;
            case 7:
              socket.emit("architect draw", {roomName: roomName});
              break;
          }
        }
        socket.on("architect draw", function (cards) {
          log("You got two cards after taking a action: " + cardsToString(cards));
          $scope.localPlayer.gainDistrictHand(cards);
        });
        socket.on("architect draw log", function (nickname) {
          log("Player " + nickname + " the Architect got two cards after taking a action");
        });
        $scope.takeTwoGold = function () {
          $scope.localPlayer.gainGold(2);
          $scope.isBuild = true;
          log("You choose to take two gold");
          socket.emit("take two gold", {roomName: roomName});
          checkAfterAction();
        };
        socket.on("take two gold", function (data) {
          log("Player " + data.nickname + " took two gold from the bank");
        });
        $scope.drawTwoCards = function () {
          log("You choose to draw two cards");
          socket.emit("draw two cards", {roomName: roomName, draw: 2});
        };
        $scope.chooseOneCard = function (card) {
          log("You choose the card " + card.name + ", discarded the other card");
          socket.emit("choose one discard one", {roomName: roomName});
          $scope.localPlayer.gainDistrictHand([card]);
          $scope.isBuild = true;
          checkAfterAction();
        };
        socket.on("draw two cards", function (data) {
          if (data.nickname) {
            log("Player " + data.nickname + "drew two cards from the deck");
          } else if (data.cards) {
            log("You have drawn two district cards: " + cardsToString(data.cards));
            $scope.chooseDiscardCards = data.cards;
          }
        });
        socket.on("choose one discard one", function (data) {
          log("Player " + data.nickname + " chose one card and discard the other one");
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
            log("As the " + char.name + ", you will be murdered on your turn");
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
            log("As the " + char.name + ", you will stolen at the start of your turn");
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
          if (card.cost > 1)
            $scope.localPlayer.gold -= (card.cost-1);
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
          $scope[$scope.localPlayer.currCharacter.name] = false;
          $scope.murdered = false;
          socket.emit("play character", {roomName: roomName});
        };
        socket.on("game end this round", function (data) {
          log("Player " + data.nickname + " has at least 8 districts. The game will end this round");
        });
        socket.on("game end", function (data) {
          log("The winner is " + data.winner.nickname);
        });
        socket.on("haunted city", function (data) {
          if (data.nickname == nickname) {
            $scope.HauntedCity = true;
            log("You own Haunted City, it's your turn to choose its color.")
          } else {
            log("Player " + data.nickname + " who owns Haunted City is choosing its color.")
          }
        });
        $scope.chooseHauntedCity = function (type) {
          $scope.localPlayer.setHauntedCityAttr("type", type.type);
          socket.emit("haunted city", {roomName: roomName, type: type});
          $scope.HauntedCity = false;
          log("Your haunted city's type is " + type.type + " with color " + type.color);
        };
        socket.on("haunted city done", function (data) {
          log("The haunted city's type is " + data.type.type + " with color " + data.type.color);
        });
        $scope.leave = function () {
          playersWatch();
          socket.emit("leave room", {roomName: roomName});
        };
        socket.on("leave room", function (data) {
          var room = socketData.remoteRooms[data.roomName];
          delete room.players[data.player.nickname];
          room.numberOfPlayers = Object.keys(room.players).length;
          if (Object.keys(socketData.remoteRooms[data.roomName].players).length == 0) {
            delete socketData.remoteRooms[data.roomName];
          }
          if (socketData.localPlayer.nickname = data.player.nickname) {
            $scope.$state.go("main");
          }
        });
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
