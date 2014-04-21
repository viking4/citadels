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
    },
    "ui-bootstrap": {
      deps: ["angular"]
    },
    "angular-sanitize": {
      deps: ["angular"]
    }
  },
  paths: {
    "angular": "../bower_components/angular/angular",
    "btford.socket-io": "lib/socket",
    "socket.io": "/socket.io/socket.io",
    "ui-router": "../bower_components/angular-ui-router/release/angular-ui-router",
    "ui-bootstrap": "../bower_components/angular-bootstrap/ui-bootstrap-tpls",
    "angular-sanitize": "../bower_components/angular-sanitize/angular-sanitize"
  },
  modules: [
    {
      name: "boot"
    }
  ],
  priority: ["angular"]
});
