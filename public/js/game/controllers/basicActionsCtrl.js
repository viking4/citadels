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
          $scope.hideTwoGold = true;
          $scope.chooseOne = true;
          game.log("You choose to draw two cards");
          $scope.socket.emit("draw two cards", {roomName: game.roomName});
        };
        $scope.socket.on("draw two cards", function (data) {
          if (game.nickname == data.nickname) {
            game.log("You have drawn two district cards: " + game.cardsToString(data.cards));
            $scope.chooseDiscardCards = data.cards;
          } else {
            game.log(data.nickname + " drew two cards from the deck");
          }
        });
        $scope.chooseOneCard = function (card) {
          game.gainDistrictHand([card]);
          game.buildTurn = true;
          game.log("You choose the card " + card.name + ", discarded the other card");
          $scope.socket.emit("choose one", {roomName: game.roomName});
          checkAfterAction();
        };

        $scope.socket.on("choose one", function (data) {
          game.players[data.nickname].numberOfDistrictCards++;
          game.log(data.nickname + " choose one card and discard the other one");
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
            $scope.hideTwoGold = false;
            $scope.chooseOne = false;
          }
        }, true)
      }])
});