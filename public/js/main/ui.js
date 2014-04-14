define(["angular", "ui-router", "utils/services"], function (angular) {
  "use strict";

  return angular.module("main.ui", ["ui.router", "utils.services"])
    .config(["$stateProvider", "$urlRouterProvider",
      function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/main");
        $stateProvider
          .state("main", {
            url: "/main",
            views: {
              "root1": {
                templateUrl: "main/main.html",
                controller: "MainCtrl"
              }
            }
          })
    }])
    .run(["$rootScope", "$state", "$stateParams", "socket", "socketData",
      function ($rootScope, $state, $stateParams, socket, socketData) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.socket = socket;
        $rootScope.socketData = socketData;

        $rootScope.$on('$stateChangeSuccess',
          function(event, toState, toParams, fromState, fromParams) {
            if (toState != "main" && !socketData.localPlayer.nickname) {
              $state.go("main");
            }
        });

        socket.on("connect", function () {
          console.log("Connected to socket server");
          socket.emit('new client');
          socketData.socketConnected = true;
        });

        socket.on("disconnect", function () {
          console.log("Disconnected from socket server");
        });

        socket.on("new player", function (data) {
          socketData.remotePlayers[data.nickname] = data;
        });

        socket.on("remove player", function (data) {
          var player = socketData.remotePlayers[data.nickname];
          if (player) {
            delete socketData.remotePlayers[data.nickname];
          } else {
            console.log("Player not found: "+data.id);
            return;
          }
        });

        socket.on("join room", function (data) {
          if (socketData.remoteRooms[data.roomName]) {
            console.log(data.player.nickname + " has joined " + data.roomName);
          } else {
            socketData.remoteRooms[data.roomName] = {
              roomName: data.roomName,
              players: {}
            };
            console.log(data.player.nickname + " has created " + data.roomName);
          }
          socketData.remoteRooms[data.roomName].players[data.player.nickname] = {
            nickname: data.player.nickname,
            id: data.player.id
          };
        });

        socket.on("leave room", function (data) {
          delete socketData.remoteRooms[data.roomName].players[data.player.nickname];
          if (Object.keys(socketData.remoteRooms[data.roomName].players).length == 0) {
            delete socketData.remoteRooms[data.roomName];
          }
        });
      }]);
});