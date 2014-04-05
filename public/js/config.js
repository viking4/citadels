require.config({
  baseUrl: 'http://localhost:8080/js',
  packages: ['main'],
  shim: {
    'angular': {
      exports: 'angular'
    },
    'btford.socket-io': {
      deps: ['angular', 'socket.io']
    }
  },
  paths: {
    'angular': '../bower_components/angular/angular',
    'socket.io': '../node_modules/socket.io/node_modules/socket.io-client/dist/socket.io',
    'btford.socket-io': '../bower_components/angular-socket-io/socket'
  },
  modules: [
    {
      name: 'boot'
    }
  ],
  priority: ['angular']
});
