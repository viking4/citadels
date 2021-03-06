define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.warlordCtrl", [])
    .controller("WarlordCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.destroy = function (player, card) {
          if (card.cost > 1)
            game.gold -= (card.cost-1);
          if (player.ownedDistricts["Great Wall"] && card.name != 'Great Wall')
            game.gold--;
          $scope.socket.emit("destroy", {roomName: game.roomName, player: player, card: card});
          game.Warlord = false;
          game.log("You choose to destroy the district " + card.name + " of " + player.nickname);
        };
        $scope.socket.on("destroy", function (data) {
          if (game.nickname == data.nickname) {
            delete game.ownedDistricts[data.card.name];
            game.log("The Warlord has destroyed your district " + data.card.name);
          } else {
            game.log("The Warlord has destroyed the district " + data.card.name + " of " + data.nickname);
          }
          game.players[data.warlord].gold -= (data.card.cost-1);

          if (data.card.name != "Graveyard" && game.currentCharacter.name != "Warlord" && game.isOwned("Graveyard") && game.gold > 1) {
            $scope.Graveyard = true;
            $scope.destroyedCard = data.card;
            $scope.socket.emit("graveyard", {roomName: game.roomName, card: data.card})
          }
        });
        $scope.socket.on("graveyard", function (data) {
          if (game.currentCharacter.name == "Warlord") {
            game.disableEndTurn = true;
          }
          game.log(data.nickname + " is using Graveyard ability");
        });

        // graveyard
        $scope.agree = function () {
          game.gainGold(-1);
          game.gainDistrictHand([$scope.destroyedCard]);
          $scope.socket.emit("graveyard done", {roomName: game.roomName, card: $scope.destroyedCard});
          game.log("You take " + $scope.destroyedCard.name + " into your hand");
          $scope.Graveyard = false;
        };
        $scope.deny = function () {
          $scope.socket.emit("graveyard done", {roomName: game.roomName});
          game.log("You passed the Graveyard's ability");
          $scope.Graveyard = false;
        };
        $scope.socket.on("graveyard done", function (data) {
          if (data.card) {
            game.log(data.nickname + " has taken " + data.card.name + " into his hand");
          } else {
            game.log(data.nickname + " has passed the Graveyard's ability");
          }
          if (game.currentCharacter.name == "Warlord")
            game.disableEndTurn = false;
        });
      }])
});