define(["angular", "btford.socket-io"], function (angular) {
  "use strict";

  return angular.module("utils.services", ["btford.socket-io"])
    .factory("socket", ["socketFactory", function (socketFactory) {
      return socketFactory({
        ioSocket: io.connect("http://localhost", {port: 7000, transports: ["websocket"]})
      });
    }])
    .factory("socketData", function () {
      var data = {
        reset:  function () {
          angular.extend(this, {
            localPlayer: {
              nickname: ""
            },
            remotePlayers: {},
            remoteRooms: {}
          });
        },
        socketConnected: false
      };
      data.reset();
      return data;
    })
});