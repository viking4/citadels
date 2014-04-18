define(["angular", "ui-router"], function (angular) {
  "use strict";

  return angular.module("game.ui", ["ui.router"])
    .config(["$stateProvider", function ($stateProvider) {
      $stateProvider
        .state("lobby", {
          url: "/lobby/:roomName",
          views: {
            "root1": {
              templateUrl: "html/game/game.html",
              controller: "GameCtrl"
            },
            "log@lobby": {
              templateUrl: "html/game/partials/log.html",
              controller: "LogCtrl"
            },
            "characters@lobby": {
              templateUrl: "html/game/partials/characters.html",
              controller: "CharactersCtrl"
            },
            "basic-actions@lobby": {
              templateUrl: "html/game/partials/basic_actions.html",
              controller: "BasicActionsCtrl"
            },
            "player@lobby": {
              templateUrl: "html/game/partials/player.html",
              controller: "PlayerCtrl"
            },
            "assassin@lobby": {
              templateUrl: "html/game/partials/assassin.html",
              controller: "AssassinCtrl"
            },
            "thief@lobby": {
              templateUrl: "html/game/partials/thief.html",
              controller: "ThiefCtrl"
            },
            "magician@lobby": {
              templateUrl: "html/game/partials/magician.html",
              controller: "MagicianCtrl"
            },
            "warlord@lobby": {
              templateUrl: "html/game/partials/warlord.html",
              controller: "WarlordCtrl"
            },
            "type-selection@lobby": {
              templateUrl: "html/game/partials/type_selection.html",
              controller: "TypeSelectionCtrl"
            }
          }
        })
    }])
});