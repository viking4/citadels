define(["angular"], function (angular) {
  "use strict";

  return angular.module("game.controllers.assassinCtrl", [])
    .controller("AssassinCtrl", ["$scope", "gameFactory",
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

        $scope.murder = function (char) {
          if (char.rank > 0) {
            game.log("You choose to murder " + char.name);
            $scope.socket.emit("murder", {roomName: game.roomName, character: char});
          }
          game.Assassin = false;
        };
        $scope.socket.on("murder", function (data) {
          game.murderVictim = data.character;
          if (game.characters[data.character.rank]) {
            game.log("As the " + data.character.name + ", you will be murdered on the coming turn");
            game.characters[data.character.rank].status = "murdered";
          } else {
            game.log("The Assassin chooses to murder " + data.character.name);
          }
        });
      }])
});