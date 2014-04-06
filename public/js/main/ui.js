define(["angular", "ui-router"], function (angular) {
  "use strict";

  return angular.module("main.ui", ["ui.router"])
    .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise("/main");
      $stateProvider
        .state("main", {
          url: "/main",
          views: {
            "root1": {
              templateUrl: "main/main.html",
              controller: "MainCtrl"
            }
          }
        })
    }]);
});