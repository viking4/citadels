define(["angular", "ui-router"], function (angular) {
  "use strict";

  return angular.module("main.ui", ["ui.router"])
    .config(["$stateProvider", "$urlRouterProvider",
      function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/main");
        $stateProvider
          .state("main", {
            url: "/main",
            views: {
              "root1": {
                templateUrl: "html/main/main.html",
                controller: "MainCtrl"
              }
            }
          })
    }])
    .run(["$rootScope", "$state", "$stateParams", "socket", "appFactory", "gameFactory",
      function ($rootScope, $state, $stateParams, socket, app, game) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.socket = socket;
        $rootScope.app = app;
        $rootScope.game = game;

        game.init("", "", 0);
        var playersWatch;
        $rootScope.$on('$stateChangeSuccess',
          function(event, toState, toParams, fromState, fromParams) {
            if (toState.name != "main" && !app.player.nickname) {
              $state.go("main");
            } else if (toState.name == "lobby") {
              game.init(app.player.nickname, $stateParams.roomName, app.remoteRooms[$stateParams.roomName].roomCap);
              playersWatch = $rootScope.$watch("app.remoteRooms." + $stateParams.roomName, function (data) {
                if (data)
                  game.players = data.players;
              }, true);
            }
            if (fromState.name == "lobby") {
              if (playersWatch)
                playersWatch();
            }
        });
      }]);
});