var usernames = {};
var responses = {};
var sIdDrawing;
var imgData;

exports.onJoin = function(socket, data) {
	console.log("A new user: "+data.username+ " has miraculously joined");
    usernames[socket.id] = data.username;
    if (nobodyDrawing()) {
        setUserDrawing(socket.id);
    }
    emitGameInfo(socket);
}

exports.onDisconnect = function(socket) {
	console.log("User "+usernames[socket.id]+" lost connection. Dropping.");
	delete usernames[socket.id];
    delete responses[socket.id];
    if (socket.id==sIdDrawing) {
	  emitGameInfo(socket.broadcast);
    }
}

exports.onSendResponse = function(socket, data) {
	console.log("User sent response: "+data.answer);
    socket.broadcast.emit('response_added', {
      sId : socket.id,
      username: usernames[socket.id],
      answer: data.answer
    });
}

exports.onAcceptResponse = function(socket, data) {
	console.log("User accepted response: "+data.sId);
    socket.broadcast.emit('game_finished', {sId: data.sId});
}

exports.onRejectResponse = function(socket, data) {
	console.log("User rejected response: "+data.sId);
    delete responses[sId];
    socket.broadcast.emit('response_rejected', {sId: data.sId});
}

exports.onCanvasChange = function(socket, data) {
	imgData = data.image;
    socket.broadcast.emit('notify_canvas_changed', {image: data.image});
}

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
        image: imgData
    });
};
