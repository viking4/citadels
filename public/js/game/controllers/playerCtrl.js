define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.playerCtrl", [])
    .controller("PlayerCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.build = function (card) {
          game.buildDistrict(card);
          game.log("You built " + card.name + " type " + card.type + " cost " + card.cost);
          $scope.socket.emit("build", {roomName: game.roomName, card: card});

          switch (card.name) {
            case "School of Magic":
              game.SchoolOfMagic = true;
              break;
            case "Laboratory":
              game.Laboratory = true;
              break;
            case "Smithy":
              game.Smithy = true;
              break;
          }
        };
        $scope.socket.on("build", function (data) {
          game.log(data.nickname + " has built " + data.card.name + ", Type: " + data.card.type + ", Cost: " + data.card.cost);
        });

        // Lab
        $scope.toggleLab = function () {
          $scope.LaboratoryOn = !$scope.LaboratoryOn;
        };
        $scope.discardLab = function (card) {
          game.districtHand.splice(game.districtHand.indexOf(card), 1);
          game.gainGold(1);

          $scope.socket.emit("laboratory", {roomName: game.roomName, card: card});
          game.log("You discarded " + card.name + " and gained one gold");

          $scope.LaboratoryOn = false;
          game.Laboratory = false;
        };
        $scope.socket.on("laboratory", function (data) {
          game.log(data.nickname + " has used the Laboratory's ability, discarded one of his card for one gold.");
        });

        // Smithy
        $scope.useSmithy = function () {
          game.gainGold(-2);
          $scope.socket.emit("smithy", {roomName: game.roomName});
          game.log("You have paid two gold (Smithy)");
          game.Smithy = false;
        };
        $scope.socket.on("smithy", function (data) {
          if (data.cards) {
            game.gainDistrictHand(data.cards);
            game.log("You have drawn three cards (Smithy) " + game.cardsToString(data.cards));
          } else {
            game.log(data.nickname + " has drawn three cards (Smithy)");
          }
        });

        $scope.$watch("game.onTurn", function (val) {
          if (!val) {
            $scope.LaboratoryOn = val;
          }
        });
      }]);
});