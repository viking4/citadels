define([
    "angular",
    "./controllers/gameCtrl",
    "./controllers/charactersCtrl",
    "./controllers/basicActionsCtrl",
    "./controllers/assassinCtrl",
    "./controllers/thiefCtrl",
    "./controllers/magicianCtrl",
    "./controllers/warlordCtrl",
    "./controllers/hauntedCityCtrl"
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
      "game.controllers.hauntedCityCtrl"
    ])
    .controller("LogCtrl", ["$scope", "gameFactory",
      function ($scope) {
        $scope.chat = function () {
          $scope.socket.emit("chat", {roomName: $scope.$stateParams.roomName, chat: $scope.chatInput});
          $scope.chatInput = "";
        };
        $scope.socket.on("chat", function (data) {
          $scope.chatLog += data.nickname + ": " + data.chat + "\n";
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
      }])
});
