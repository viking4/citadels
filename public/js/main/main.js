define(['angular', 'btford.socket-io'], function (angular) {
  'use strict';

  return angular.module('main', ['btford.socket-io'])
    .factory('socket', ['socketFactory', function (socketFactory) {
      return socketFactory({
        ioSocket: io.connect("http://localhost", {port: 8000, transports: ["websocket"]})
      });
    }])
    .controller('mainCtrl', ['$scope', 'socket', function ($scope, socket) {
      $scope.remotePlayers = [];
      $scope.localPlayer = {
        id: 0
      };
      
      socket.on("connect", onSocketConnected);
      socket.on("on client", function (data) {
        $scope.localPlayer.id = data.id
      });
      socket.on("disconnect", onSocketDisconnect);
      socket.on("new player", onNewPlayer);
      socket.on("remove player", onRemovePlayer);

      function onSocketConnected() {
        console.log("Connected to socket server");
        socket.emit("new player", {});
      }

      function onSocketDisconnect() {
        console.log("Disconnected from socket server");
      }

      function onNewPlayer(data) {
        console.log("New player connected: "+data.id);
        var newPlayer = {
          id: data.id,
          characterHand: [],
          districtHand: [],
          gold: 0
        };
        $scope.remotePlayers.push(newPlayer);
      }

      function onRemovePlayer(data) {
        var removePlayer = playerById(data.id);

        if (!removePlayer) {
          console.log("Player not found: "+data.id);
          return;
        }

        $scope.remotePlayers.splice($scope.remotePlayers.indexOf(removePlayer), 1);
      }

      function playerById(id) {
        var i;
        for (i = 0; i < $scope.remotePlayers.length; i++) {
          if ($scope.remotePlayers[i].id == id)
            return $scope.remotePlayers[i];
        }

        return false;
      }
    }]);
});
