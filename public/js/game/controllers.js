define([
    "angular",
    "./controllers/gameCtrl",
    "./controllers/charactersCtrl",
    "./controllers/basicActionsCtrl",
    "./controllers/assassinCtrl",
    "./controllers/thiefCtrl",
    "./controllers/magicianCtrl",
    "./controllers/warlordCtrl",
    "./controllers/typeSelectionCtrl"
  ],

  function (angular) {
    "use strict";

    return angular.module("game.controllers", [
      "game.controllers.gameCtrl",
      "game.controllers.charactersCtrl",
      "game.controllers.basicActionsCtrl",
      "game.controllers.assassinCtrl",
      "game.controllers.thiefCtrl",
      "game.controllers.magicianCtrl",
      "game.controllers.warlordCtrl",
      "game.controllers.typeSelectionCtrl"
    ])
    .controller("LogCtrl", ["$scope", "gameFactory",
      function ($scope) {
        $scope.chat = function () {
          $scope.socket.emit("chat", {roomName: $scope.$stateParams.roomName, chat: $scope.chatInput});
          $scope.chatInput = "";
        };
        $scope.socket.on("chat", function (data) {
          $scope.chatLog += data.nickname + " " + data.chat + "\n";
        });
      }])
    .controller("PlayerCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.build = function (card) {
          game.buildDistrict(card);
          game.log("You built " + card.name + " type " + card.type + " cost " + card.cost);
          $scope.socket.emit("build", {roomName: game.roomName, card: card});
        };
        $scope.socket.on("build", function (data) {
          game.players[data.nickname].ownedDistricts.push(data.card);
          game.players[data.nickname].numberOfDistrictCards--;
          game.players[data.nickname].gold -= data.card.cost;
          game.log(data.nickname + " has built " + data.card.name + ", Type: " + data.card.type + ", Cost: " + data.card.cost);
        });

        $scope.useLaboratory = function () {
          $scope.LaboratoryOn = true;
          $scope.Laboratory = false;
        };
        $scope.discardLab = function (card) {
          game.districtHand.splice(game.districtHand.indexOf(card), 1);
          game.gainGold(1);
          $scope.LaboratoryOn = false;
          $scope.socket.emit("laboratory", {roomName: game.roomName, card: card});
          game.log("You discarded " + card.name + " and gained one gold");
        };
        $scope.socket.on("laboratory", function (data) {
          game.players[data.nickname].numberOfDistrictCards--;
          game.players[data.nickname].gold++;
          game.log(data.nickname + " has used the Laboratory's skill, discarded one of his card for one gold.");
        });
        $scope.$watch("game.onTurn", function (val) {
          if (game.isOwned("Laboratory")) {
            $scope.Laboratory = val;
          }
        })
      }])
});
