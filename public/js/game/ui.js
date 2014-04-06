define(["angular", "ui-router"], function (angular) {
  "use strict";

  return angular.module("game.ui", ["ui.router"])
    .config(["$stateProvider", function ($stateProvider) {
      $stateProvider
        .state("lobby", {
          url: "/lobby/:roomName",
          views: {
            "root1": {
              templateUrl: "game/lobby.html",
              controller: "LobbyCtrl"
            }
          }
        })
    }]);
});