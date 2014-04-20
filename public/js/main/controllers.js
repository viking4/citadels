define(["angular"], function (angular) {
  "use strict";

  return angular.module("main.controllers", [])
    .controller("MainCtrl", ["$scope", "appFactory",
      function ($scope, app) {
        var socket = $scope.socket;
        var cools = ["Westhurst", "Belgate", "Oldness", "Goldholt", "Janhaven", "Faircliff", "Deepsage", "Aldsea", "Snowburn", "Castlewald", "Draccastle", "Mallowsea", "Southspell", "Lighthill"];
        $scope.roomName = cools[Math.floor(Math.random()*(cools.length+1))];

        $scope.createPlayer = function () {
          if (app.socketConnected && $scope.nickname) {
            if (app.remotePlayers[$scope.nickname]) {
              $scope.invalidNickname = true;
            } else {
              $scope.socket.emit("new player", {nickname: $scope.nickname});
              app.player.nickname = $scope.nickname;
            }
          }
        };

        $scope.createRoom = function () {
          if (app.remoteRooms[$scope.roomName]) {
            $scope.roomExisted = true;
          } else if ($scope.roomCap != 2) {
            $scope.not2 = true;
          } else {
            app.remoteRooms[$scope.roomName] = {
              roomName: $scope.roomName,
              players: {},
              roomCap: $scope.roomCap,
              getNumberOfPlayers: function () {
                return Object.keys(this.players).length;
              }
            };
            socket.emit("join room", {roomName: $scope.roomName, roomCap: $scope.roomCap});
          }
        };

        $scope.joinRoom = function (roomName) {
          var room = app.remoteRooms[roomName];
          if (Object.keys(room.players).length == room.roomCap) {
            $scope.roomFull = true;
          } else {
            $scope.socket.emit("join room", {roomName: roomName});
          }
        };
        
        socket.on("join room", function (data) {
          var room = app.remoteRooms[data.roomName];
          if (room) {
            console.log(data.player.nickname + " has joined " + data.roomName);
          } else {
            app.remoteRooms[data.roomName] = {
              roomName: data.roomName,
              players: {},
              roomCap: data.roomCap,
              getNumberOfPlayers: function () {
                return Object.keys(this.players).length;
              }
            };
            console.log(data.player.nickname + " has created " + data.roomName);
          }
          app.remoteRooms[data.roomName].players[data.player.nickname] = {
            nickname: data.player.nickname,
            id: data.player.id,
            ownedDistricts: {},
            numberOfDistrictCards: 0,
            gold: 0,
            getOwnedDistrctsLength: function () {
              return Object.keys(this.ownedDistricts).length;
            }
          };
          if (app.player.nickname == data.player.nickname) {
            $scope.$state.go("lobby", {roomName: data.roomName});
          }
        });
        
        socket.on("connect", function () {
          console.log("Connected to socket server");
          socket.emit('new client');
          app.socketConnected = true;
        });

        socket.on("disconnect", function () {
          console.log("Disconnected from socket server");
        });

        socket.on("new player", function (data) {
          app.remotePlayers[data.nickname] = data;
        });

        socket.on("remove player", function (data) {
          var player = app.remotePlayers[data.nickname];
          if (player) {
            delete app.remotePlayers[data.nickname];
            var keys  = Object.keys(app.remoteRooms);
            for (var i = 0, ii = keys.length; i < ii; i++) {
              delete app.remoteRooms[keys[i]].players[data.nickname];
            }
          } else {
            console.log("Player not found: "+data.id);
            return;
          }
        });

        $scope.logout = function () {
          console.log("logging out: " + app.player.nickname);
          socket.emit("remove player", {nickname: app.player.nickname});
          app.player.nickname = "";
        };

        $scope.$watch("app.remoteRooms", function () {
          var keys = Object.keys(app.remoteRooms);
          for (var i = 0, ii = keys.length; i < ii; i++) {
            var room =  app.remoteRooms[keys[i]];
            app.remoteRooms[keys[i]].numberOfPlayers = room.getNumberOfPlayers();
            if (room.numberOfPlayers == 0) {
              delete app.remoteRooms[keys[i]];
            }
          }
        })
    }]);
});
