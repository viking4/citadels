define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.thiefCtrl", [])
    .controller("ThiefCtrl", ["$scope", "gameFactory",
      function ($scope, game) {
        $scope.targets = {
          2: {rank: 2, name: 'Thief'},
          3: {rank: 3, name: 'Magician'},
          4: {rank: 4, name: 'King'},
          5: {rank: 5, name: 'Bishop'},
          6: {rank: 6, name: 'Merchant'},
          7: {rank: 7, name: 'Architect'},
          8: {rank: 8, name: 'Warlord'}
        };

        $scope.steal = function (char) {
          if (char.rank > 0) {
            game.log("You choose to steal from " + char.name);
            $scope.socket.emit("steal", {roomName: game.roomName, character: char});
          }
          game.Thief = false;
        };

        $scope.socket.on("stolen", function (data) {
          if (game.characters[2]) {
            game.gainGold(data.gold);
            game.log("You have got " + data.gold + " gold from stealing");
          } else {
            game.log(game.thiefNickname + " the Thief has got " + data.gold + " gold from stealing")
          }
          if (game.nickname != data.nickname) {
            game.log(data.nickname + " the victim of the Thief has lost " + data.gold);
          }
        });

        $scope.socket.on("steal", function (data) {
          game.thiefNickname = data.nickname;
          if (game.characters[data.character.rank]) {
            game.log("As the " + data.character.name + ", you will be stolen at the start of your turn");
            game.characters[data.character.rank].status = "stolen";
          } else {
            game.log("The Thief will steal from " + data.character.name);
          }
        });
      }])
});