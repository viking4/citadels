define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.charactersCtrl", [])
    .controller("CharactersCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.socket.on("select character", function (data) {
          $scope.newRound = false;
          if (data.newRound) {
            $scope.newRound = true;
            game.characters = {};
            game.murderVictim = {};
            game.thiefNickname = "";
            game.bishopNickname = "";
            if (game.ownedDistricts["Haunted City"])
              game.ownedDistricts["Haunted City"].active = true;
            game.reOrder(data.nickname);
            game.faceupCards = data.faceupCards;
            game.log("New round has begun.");
          }
          if (data.nickname == game.nickname) {
            $scope.selectCharacter = true;
            $scope.discardTurn = false;
            $scope.characterCards = data.characterCards;

            game.log(game.nickname + " (You) is choosing characters: " + game.charsToString($scope.characterCards));
          } else {
            game.log(data.nickname + " is choosing characters");
          }
        });
        var chosenChar;
        $scope.choose = function (char) {
          game.log("You have chosen " + char.name);
          game.characters[char.rank] = char;
          chosenChar = $scope.characterCards.splice($scope.characterCards.indexOf(char), 1)[0];
          if ($scope.newRound || game.order.length > 2 || $scope.characterCards.length == 1) {
            game.log("Remaining characters: " + game.charsToString($scope.characterCards));
            $scope.socket.emit("select character", {roomName: game.roomName, character: char, characterCards: $scope.characterCards});
            $scope.selectCharacter = false;
          }
          $scope.discardTurn  = true;
        };
        $scope.discard = function (char) {
          $scope.characterCards.splice($scope.characterCards.indexOf(char), 1);
          game.log("You have discarded " + char.name + ". Remaining characters: " + game.charsToString($scope.characterCards));
          $scope.socket.emit("select character", {roomName: game.roomName, character: chosenChar, characterCards: $scope.characterCards});
          $scope.selectCharacter = false;
        };
      }])
});