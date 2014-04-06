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
            $scope.invalidRoomName = true;
          } else {
            socket.emit("join room", {roomName: $scope.roomName});
            $scope.socketData.remoteRooms[$scope.roomName] = {
              roomName: $scope.roomName,
              players: {}
            };
            $scope.socketData.remoteRooms[$scope.roomName].players[socketData.localPlayer.nickname] = {
              nickname: socketData.localPlayer.nickname
            };
            $scope.$state.go("lobby", {roomName: $scope.roomName});
          }
        };

        $scope.joinRoom = function (roomName) {
          $scope.socket.emit("join room", {roomName: roomName});
          $scope.socketData.remoteRooms[roomName].players[socketData.localPlayer.nickname] = {
            nickname: socketData.localPlayer.nickname
          };
          $scope.$state.go("lobby", {roomName: roomName});
        };

        $scope.logout = function () {
          console.log("logging out: " + socketData.localPlayer.nickname);
          socket.emit("remove player", {nickname: socketData.localPlayer.nickname});
          $scope.socketData.localPlayer.nickname = "";
        };
    }]);
});
