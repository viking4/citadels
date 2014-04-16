define(["angular", "btford.socket-io"], function (angular) {
  "use strict";

  return angular.module("utils.services", ["btford.socket-io"])
    .factory("socket", ["socketFactory", function (socketFactory) {
      return socketFactory({
        ioSocket: io.connect("http://localhost", {port: 5000, transports: ["websocket"]})
      });
    }])
    .factory("socketData", function () {
      var data = {
        socketConnected: false,
        reset:  function () {
          angular.extend(this, {
            localPlayer: {
              nickname: ""
            },
            remotePlayers: {},
            remoteRooms: {}
          });
        }
      };
      data.reset();
      return data;
    })
});