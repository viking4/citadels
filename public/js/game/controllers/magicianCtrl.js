define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.magicianCtrl", [])
    .controller("MagicianCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.noOfExchangeCards = 0;

        $scope.exchange = function (player) {
          if (player) {
            $scope.socket.emit("exchange", {roomName: game.roomName, player: player});
            game.districtHand = [];
            game.log("You choose to exchange your hand with " + player.nickname);
          } else {
            game.log("You choose to exchange " + $scope.noOfExchangeCards + " of your cards with the deck");
            $scope.socket.emit("exchange", {roomName: game.roomName, noOfExchangeCards: $scope.noOfExchangeCards});
          }
          game.Magician = false;
        };

        $scope.checkNoOfExchangeCards = function () {
          if ($scope.noOfExchangeCards > 0 && $scope.noOfExchangeCards < game.districtHand.length) {
            game.log("You need to choose cards to discard");
            $scope.chooseExchangeCards = true;
            $scope.exchangeCount = 0;
          } else if ($scope.noOfExchangeCards == game.districtHand.length) {
            game.districtHand = [];
            $scope.exchange();
            game.Magician = false;
          } else if ($scope.noOfExchangeCards == 0) {
            game.log("You skipped exchange");
            game.Magician = false;
          } else {
            game.log("Invalid number of cards to exchange");
          }
        };
        $scope.discardCardToExchange = function (card) {
          game.districtHand.splice(game.districtHand.indexOf(card), 1);
          $scope.exchangeCount++;
          if ($scope.noOfExchangeCards == $scope.exchangeCount) {
            $scope.exchange();
            game.Magician = false;
          } else {
            game.log("Discarded "+ card.name + ", only " + $scope.exchangeCount + "/" + $scope.noOfExchangeCards + " cards to discard");
          }
        };
        $scope.socket.on("exchange", function (data) {
          if (game.nickname == data.exchanger.nickname) {
            game.gainDistrictHand(data.exchanger.cards);
            if (data.exchangee) {
              game.players[data.exchangee.nickname].numberOfDistrictCards = data.exchangee.cards.length;
            }
            game.log("Your district hand is " + game.cardsToString(data.exchanger.cards) + " after the exchange");
          } else if (data.exchangee) {
            if (game.nickname == data.exchangee.nickname) {
              game.districtHand = data.exchangee.cards;
              game.log("You got exchanged, now your district hand is " + game.cardsToString(game.districtHand));
              game.players[data.exchanger.nickname].numberOfDistrictCards = data.exchanger.cards.length;
            } else {
              game.players[data.exchangee.nickname].numberOfDistrictCards = data.exchangee.cards.length;
              game.players[data.exchanger.nickname].numberOfDistrictCards = data.exchanger.cards.length;
              game.log(data.exchanger.nickname + " has exchanged cards with " + data.exchangee.nickname);
            }
          }
        });
        $scope.$watch("game.onTurn", function (val) {
          if (val) {
            $scope.noOfExchangeCards = 0;
            $scope.chooseExchangeCards = false;
          }
        })

      }])
});