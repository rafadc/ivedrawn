
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express.createServer()
  , routes = require('./routes')
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

var usernames = {};
var responses = {};
var sIdDrawing;
var imgData;

io.sockets.on('connection', function (socket) {
  console.log("Socket "+socket.id+ " connected");
  socket.send(socket.id);

  socket.on('join', function (data) {
    console.log("A new user: "+data.username+ " has miraculously joined");
    usernames[socket.id] = data.username;
    if (sIdDrawing==undefined) {
      setUserDrawing(socket.id);
    }
    emitGameInfo(socket);
  });

  socket.on('send_response', function (data) {
    console.log("User sent response: "+data.answer);
    socket.broadcast.emit('response_added', {
      sId : socket.id,
      username: usernames[socket.id],
      answer: data.answer
    });
  });

  socket.on('accept_response', function (data) {
    console.log("User accepted response: "+data.sId);
    socket.broadcast.emit('game_finished', {sId: data.sId});
  });

  socket.on('reject_response', function (data) {
    console.log("User rejected response: "+data.sId);
    delete responses[sId];
    socket.broadcast.emit('response_rejected', {sId: data.sId});
  });

  socket.on('canvas_changed', function(data) {
	imgData = data.image;
    socket.broadcast.emit('notify_canvas_changed', {image: data.image});
  });

  socket.on('disconnect', function () {
    console.log("User "+usernames[socket.id]+" lost connection. Dropping.");
    delete usernames[socket.id];
    delete responses[socket.id];
  });
});

var emitGameInfo = function(socket) {
  socket.emit('game_info', {
    sIdDrawing : sIdDrawing,
    image : imgData
  });
};

var setUserDrawing = function(sId) {
  sIdDrawing = sId;
  console.log("User "+usernames[sId]+" is now drawing");
};

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
