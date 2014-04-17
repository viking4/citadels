define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.warlordCtrl", [])
    .controller("WarlordCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.destroy = function (player, card) {
          if (card.cost > 1)
            game.gold -= (card.cost-1);
          game.destroyDistrict.call(game.players[player.nickname], card);

          $scope.socket.emit("destroy", {roomName: game.roomName, player: player, card: card});
          game.Warlord = false;
          game.log("You choose to destroy the district " + card.name + " of " + player.nickname);
        };
        $scope.socket.on("destroy", function (data) {
          if (game.nickname == data.nickname) {
            game.log("The Warlord has destroyed your district " + data.card.name);
            game.ownedDistricts.splice(game.ownedDistricts.indexOf(data.card), 1);
          } else {
            game.destroyDistrict.call(game.players[data.nickname], data.card);
            game.log("The Warlord has destroyed the district " + data.card.name + " of " + data.nickname);
          }
        });
      }])
});