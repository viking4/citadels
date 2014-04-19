define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.basicActionsCtrl", [])
    .controller("BasicActionsCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.takeTwoGold = function () {
          game.gainGold(2);
          game.buildTurn = true;
          game.log("You choose to take two gold");
          $scope.socket.emit("take two gold", {roomName: game.roomName});
          checkAfterAction();
        };
        $scope.socket.on("take two gold", function (data) {
          game.players[data.nickname].gold += 2;
          game.log(data.nickname + " took two gold from the bank. Current gold: " + game.players[data.nickname].gold);
        });
        $scope.drawTwoCards = function () {
          $scope.hideBasicActions = true;
          if (game.isOwned("Observatory")) {
            $scope.socket.emit("draw two cards", {roomName: game.roomName, observatory: true});
            game.log("You choose to draw three cards (Observatory)");
          } else {
            $scope.socket.emit("draw two cards", {roomName: game.roomName, observatory: false});
            game.log("You choose to draw two cards");
          }
        };
        $scope.socket.on("draw two cards", function (data) {
          if (game.nickname == data.nickname) {
            if (data.observatory) {
              $scope.discardNumber = 2;
              game.log("You have drawn three district cards (Observatory): " + game.cardsToString(data.cards));
            } else {
              $scope.discardNumber = 1;
              game.log("You have drawn two district cards: " + game.cardsToString(data.cards));
            }
            if (game.isOwned("Library")) {
              $scope.discardNumber--;
              game.log("You can keep one extra card (Library)");
            }
            if ($scope.discardNumber > 0) {
              $scope.drawCards = data.cards;
              $scope.chooseNumber = data.cards.length-$scope.discardNumber;
              game.log("You may take " + $scope.chooseNumber + " cards");
            } else {
              game.gainDistrictHand(data.cards);
              game.log("You has taken " + game.cardsToString(data.cards));
              for (var i = 0, ii = data.cards.length; i < ii; i++)
                $scope.socket.emit("choose one", {roomName: game.roomName});
              game.buildTurn = true;
              checkAfterAction();
            }
          } else {
            if (data.observatory) {
              game.log(data.nickname + " has drawn three district cards (Observatory)");
            } else {
              game.log(data.nickname + " has drawn two district cards");
            }
          }
        });
        $scope.choose = function (card) {
          $scope.chooseNumber--;
          game.gainDistrictHand([card]);
          $scope.drawCards.splice($scope.drawCards.indexOf(card),1);
          game.log("You choose the card " + card.name);
          if ($scope.chooseNumber == 0) {
            checkAfterAction();
            game.buildTurn = true;
          }
          $scope.socket.emit("choose one", {roomName: game.roomName});
        };
        $scope.socket.on("choose one", function (data) {
          game.players[data.nickname].numberOfDistrictCards++;
          game.log(data.nickname + " has taken one card");
        });

        function checkAfterAction() {
          switch (game.currentCharacter.rank) {
            case 6:
              game.gainGold(1);
              game.log("As the Merchant, you have gained one gold after taking an action");
              $scope.socket.emit("gold merchant", {roomName: game.roomName});
              break;
            case 7:
              $scope.socket.emit("draw architect", {roomName: game.roomName});
              break;
          }
        }
        $scope.socket.on("gold merchant", function (data) {
          game.log("As the Merchant, " + data.nickname + " have gained one gold after taking an action");
          game.players[data.nickname].gold++;
        });
        $scope.socket.on("draw architect", function (data) {
          if (game.nickname == data.nickname) {
            game.log("You got two cards after taking a action: " + game.cardsToString(data.cards));
            game.gainDistrictHand(data.cards);
          } else {
            game.players[data.nickname].numberOfDistrictCards += 2;
            game.log(data.nickname + " the Architect got two cards after taking a action. Current # of cards: " + game.players[data.nickname].numberOfDistrictCards);
          }
        });

        $scope.$watch("game.onTurn", function (val) {
          if (val) {
            $scope.hideBasicActions = false;
          }
        }, true)
      }])
});