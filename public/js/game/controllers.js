define([
    "angular",
    "./controllers/gameCtrl",
    "./controllers/playerCtrl",
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
      "game.controllers.playerCtrl",
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
      }]);
});
