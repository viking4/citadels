define(["angular", "utils/services"], function (angular) {
  "use strict";

  return angular.module("game.controllers", ["utils.services"])
    .controller("LobbyCtrl", ["$scope", "socket", "$stateParams", "$state", "player", function ($scope, socket, $stateParams, $state, player) {
      $scope.roomPlayers = [];
      $scope.player = player;

      socket.emit("join game", {id: $stateParams.id, name: $stateParams.name});

      socket.on("join game", function (data) {
        $scope.roomPlayers.push(playerById(data.id));
      });
      socket.on("leave game", function (data) {
        $scope.roomPlayers.slice($scope.roomPlayers.indexOf(playerById(data.id)), 1);
      });
      function playerById(id) {
        var i;
        for (i = 0; i < $scope.roomPlayers.length; i++) {
          if ($scope.remotePlayers[i].id == id)
            return $scope.remotePlayers[i];
        }
        return false;
      }
      $scope.leave = function () {
        socket.emit("leave game", {id: $stateParams.id});
        $state.go("main");
      }
    }]);
});
