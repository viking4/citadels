define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.warlordCtrl", [])
    .controller("WarlordCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.destroy = function (player, card) {
          if (card.cost > 1)
            game.gold -= (card.cost-1);
          var districts = game.players[player.nickname].ownedDistricts;
          for (var i = 0, ii = districts.length; i < ii; i++) {
            if (districts[i].name == card.name) {
              game.players[player.nickname].ownedDistricts.splice(i, 1);
            }
          }

          $scope.socket.emit("destroy", {roomName: game.roomName, player: player, card: card});
          game.Warlord = false;
          game.log("You choose to destroy the district " + card.name + " of " + player.nickname);
        };
        $scope.socket.on("destroy", function (data) {
          if (game.nickname == data.nickname) {
            game.log("The Warlord has destroyed your district " + data.card.name);
            for (var i = 0, ii = game.ownedDistricts.length; i < ii; i++) {
              if (game.ownedDistricts[i].name == data.card.name) {
                game.ownedDistricts.splice(i, 1);
              }
            }
          } else {
            var districts = game.players[data.nickname].ownedDistricts;
            for (var i = 0, ii = districts.length; i < ii; i++) {
              if (districts[i].name == data.card.name) {
                game.players[data.nickname].ownedDistricts.splice(i, 1);
              }
            }
            game.log("The Warlord has destroyed the district " + data.card.name + " of " + data.nickname);
          }
          game.players[data.warlord].gold -= (data.card.cost-1);
        });
      }])
});