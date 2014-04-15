define(["angular"], function (angular) {
  "use strict";

  return angular.module("main.controllers", [])
    .controller("MainCtrl", ["$scope",
      function ($scope) {
        var socketData = $scope.socketData;
        var socket = $scope.socket;

        $scope.createPlayer = function () {
          if ($scope.socketData.socketConnected && $scope.nickname) {
            if (socketData.remotePlayers[$scope.nickname]) {
              $scope.invalidNickname = true;
            } else {
              $scope.socket.emit("new player", {nickname: $scope.nickname});
              $scope.socketData.localPlayer.nickname = $scope.nickname;
            }
          }
        };

        $scope.createRoom = function () {
          if (socketData.remoteRooms[$scope.roomName]) {
            $scope.roomExisted = true;
          } else if ($scope.roomCap != 2) {
            $scope.not2 = true;
          } else {
            socket.emit("join room", {roomName: $scope.roomName, roomCap: $scope.roomCap});
          }
        };

        $scope.joinRoom = function (roomName) {
          var room = socketData.remoteRooms[roomName];
          if (Object.keys(room.players).length == room.roomCap) {
            $scope.roomFull = true;
          } else {
            $scope.socket.emit("join room", {roomName: roomName});
          }
        };

        $scope.logout = function () {
          console.log("logging out: " + socketData.localPlayer.nickname);
          socket.emit("remove player", {nickname: socketData.localPlayer.nickname});
          $scope.socketData.localPlayer.nickname = "";
        };
    }]);
});
