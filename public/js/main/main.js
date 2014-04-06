define(["angular", "./controllers", "./ui"], function (angular) {
  "use strict";

  return angular.module("main", ["main.controllers", "main.ui"])
    .run(["$rootScope", "socket", function($rootScope, socket) {
      $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams){
          if (fromState == "lobby") {
            socket.emit("leave room", {roomName: fromParams.roomName});
          }
        })
    }]);
});
