var socketIds = [];
var usernames = {};
var responses = {};
var sIdDrawing;
var imgData;

exports.onJoin = function(socket, data) {
	console.log("A new user: "+data.username+ " has miraculously joined");
	socketIds.push(socket.id);
    usernames[socket.id] = data.username;
    if (nobodyDrawing()) {
        setUserDrawing(socket.id);
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
		  delete sIdDrawing;
		  delete imgData;
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
	socket.emit('game_info', {
        sIdDrawing: data.sId,
		usernameDrawing: usernames[data.sId],
		correctWas: reponses[data.sId]
    });
	sIdDrawing = sIdDrawing;
    delete imgData;
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

var setUserDrawing = function(sId) {
    sIdDrawing = sId;
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
	setUserDrawing(pickRandomSocketId());
	emitGameInfo(socket.broadcast);
};

var pickRandomSocketId = function() {
  	return socketIds[Math.floor(Math.random()*socketIds.length)];
};

var forgetSocketId = function(sId) {
	socketIds.splice(socketIds.indexOf(sId),1);
	delete usernames[sId];
    delete responses[sId];
};