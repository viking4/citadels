var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),

  logger = require('morgan'),
  methodOverride = require('method-override'),
  errorhandler = require('errorhandler');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.use(logger('dev'));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, '/public')));

// development only
if (app.get('env') === 'development') {
  app.use(errorhandler());
}
// production only
if (app.get('env') === 'production') {
  // TODO
}

app.get('/', routes.index);
app.get('/main/:name', routes.main);
app.get('/game/:name', routes.game);

app.get('*', routes.index);

require('./routes/socket')(io);

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

exports.io = io;