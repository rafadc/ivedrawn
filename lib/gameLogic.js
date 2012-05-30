var socketIds = [];
var usernames = {};
var responses = {};
var sIdDrawing;
var imgData;
var gameResignTimer;

exports.onJoin = function(socket, data) {
	console.log("A new user: "+data.username+ " has miraculously joined");
	socketIds.push(socket.id);
  usernames[socket.id] = data.username;
  if (nobodyDrawing()) {
    setUserDrawing(socket, socket.id);
  }
  emitGameInfo(socket);
};

exports.onDisconnect = function(socket) {
	console.log("User "+usernames[socket.id]+" lost connection. Dropping.");
	forgetSocketId(socket.id);
  if (socket.id==sIdDrawing) {
	  if(socketIds.length>0) {
      chooseRandomPlayerToDraw(socket);
	  } else {
      clearGameData();
	  }
  }
};

exports.onSendResponse = function(socket, data) {
	console.log("User sent response: "+data.answer);
  socket.broadcast.emit('response_added', {
    sId : socket.id,
    username: usernames[socket.id],
    answer: data.answer
  });
};

exports.onAcceptResponse = function(socket, data) {
	console.log("User accepted response: "+data.sId);
	socket.broadcast.emit('game_info', {
    sIdDrawing: data.sId,
	  usernameDrawing: usernames[data.sId],
		correctWas: responses[data.sId]
  });
	socket.emit('game_info', {
    sIdDrawing: data.sId,
		usernameDrawing: usernames[data.sId],
		correctWas: responses[data.sId]
  });
  setUserDrawing(socket, data.sId);
};

exports.onRejectResponse = function(socket, data) {
	console.log("User rejected response: "+data.sId);
  delete responses[data.sId];
  socket.broadcast.emit('response_rejected', {sId: data.sId});
};

exports.onCanvasChange = function(socket, data) {
	imgData = data.image;
  socket.broadcast.emit('notify_canvas_changed', {image: data.image});
};

var setUserDrawing = function(socket, sId) {
  sIdDrawing = sId;
  delete imgData;
  gameResignTimer = setTimeout(function() {resignGame(socket)} ,60000); 
  console.log("User " + usernames[sId] + " is now drawing");
};

var nobodyDrawing = function() {
  return sIdDrawing == undefined;
}

var emitGameInfo = function(socket) {
  socket.emit('game_info', {
    sIdDrawing: sIdDrawing,
		usernameDrawing: usernames[sIdDrawing],
    image: imgData
  });
};

var chooseRandomPlayerToDraw = function(socket) {
	console.log("Selecting ramdomly next player to play");
	setUserDrawing(socket, pickRandomSocketId());
	emitGameInfo(socket.broadcast);
	emitGameInfo(socket);
};

var pickRandomSocketId = function() {
  randomSId = Math.floor(Math.random()*socketIds.length);
  return socketIds[randomSId];
};

var forgetSocketId = function(sId) {
	socketIds.splice(socketIds.indexOf(sId),1);
	delete usernames[sId];
  delete responses[sId];
};

var resignGame = function(socket) {
  console.log("Timeout. Creating a new game");
  clearGameData();
  chooseRandomPlayerToDraw(socket);
}

var clearGameData = function() {
  sIdDrawing = undefined;
  delete imgData;
  clearTimeout(gameResignTimer);
}
