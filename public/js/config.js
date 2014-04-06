require.config({
  baseUrl: "http://localhost:8080/js",
  packages: ["main"],
  shim: {
    "angular": {
      exports: "angular"
    },
    "btford.socket-io": {
      deps: ["angular", "socket.io"]
    },
    "ui-router": {
      deps: ["angular"]
    }
  },
  paths: {
    "angular": "../bower_components/angular/angular",
    "socket.io": "../node_modules/socket.io/node_modules/socket.io-client/dist/socket.io",
    "btford.socket-io": "../bower_components/angular-socket-io/socket",
    "ui-router": "../bower_components/angular-ui-router/release/angular-ui-router"
  },
  modules: [
    {
      name: "boot"
    }
  ],
  priority: ["angular"]
});
