define(["angular", "utils/services"], function (angular) {
  "use strict";

  return angular.module("main.controllers", ["utils.services"])
    .controller("MainCtrl", ["$scope", "socket", "$state", "player", function ($scope, socket, $state, player) {
      $scope.$state = $state;
      $scope.remoteGames = [];
      $scope.player = player;
      socket.on("connect", onSocketConnected);
      socket.on("on client", function (data) {
        $scope.player.id = data.id;
      });
      socket.on("new game", onNewGame);

      socket.on("disconnect", onSocketDisconnect);

      function onSocketConnected() {
        console.log("Connected to socket server");
        socket.emit("new player", {});
      }

      function onSocketDisconnect() {
        console.log("Disconnected from socket server");
      }

      function onNewGame(data) {
        console.log("New room created: "+data.id);
        var newGame = {
          id: data.id,
          name: data.name
        };
        $scope.remoteGames.push(newGame);
      }

      function onRemoveRoom(data) {
        var removeRoom = roomById(data.id);

        if (!removeRoom) {
          console.log("Room not found: "+data.id);
          return;
        }

        $scope.remoteGames.splice($scope.remoteGames.indexOf(removeRoom), 1);
      }

      function gameById(id) {
        var i;
        for (i = 0; i < $scope.remoteGames.length; i++) {
          if ($scope.remoteGames[i].id == id)
            return $scope.remoteGames[i];
        }

        return false;
      }
      $scope.create = function () {
        $scope.$state.go("lobby", {id: $scope.player.id, name: $scope.roomName})
      };
      $scope.join = function (id) {
        $scope.$state.go("lobby", {id: id})
      }
    }]);
});
