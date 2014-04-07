define(["angular", "btford.socket-io"], function (angular) {
  "use strict";

  return angular.module("utils.services", ["btford.socket-io"])
    .factory("socket", ["socketFactory", function (socketFactory) {
      return socketFactory({
        ioSocket: io.connect("http://localhost", {port: 8000, transports: ["websocket"]})
      });
    }])
    .factory("player", function () {
      return {
        id: ""
      }
    });
});