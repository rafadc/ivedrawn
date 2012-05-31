
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express.createServer()
  , routes = require('./routes')
  , gameLogic = require('./lib/gameLogic')
  , io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.game);

// Websocket

io.sockets.on('connection', function (socket) {
  console.log("Socket "+socket.id+ " connected");
  socket.send(socket.id);

  socket.on('join', function (data) {
    gameLogic.onJoin(socket, data);
  });

  socket.on('send_response', function (data) {
    gameLogic.onSendResponse(socket,data);
  });

  socket.on('accept_response', function (data) {
    gameLogic.onAcceptResponse(socket, data);
  });

  socket.on('reject_response', function (data) {
	gameLogic.onRejectResponse(socket, data);
  });

  socket.on('canvas_changed', function (data) {
	gameLogic.onCanvasChange(socket, data);
  });

  socket.on('disconnect', function () {
    gameLogic.onDisconnect(socket);
  });
});

// Start server

app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
