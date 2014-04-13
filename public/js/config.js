require.config({
  baseUrl: "http://localhost:5000/js",
  packages: ["main", "game"],
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
    "btford.socket-io": "../bower_components/angular-socket-io/socket",
    "socket.io": "/socket.io/socket.io",
    "ui-router": "../bower_components/angular-ui-router/release/angular-ui-router"
  },
  modules: [
    {
      name: "boot"
    }
  ],
  priority: ["angular"]
});
