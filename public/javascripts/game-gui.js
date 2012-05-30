var isDrawing = false;
var socket;
var username;

var bindGUI = function() {
  $("#set_username").click( function () {
    $('#usernameModal').modal('hide');
    username = $("#username_input").val();
    socket = io.connect('/');
    socket.on('connect', function() {
      socket.emit('join', { username: $("#username_input").val() });
    });
    socket.on('response_added', function(data) {
      addAnswerAttempt(data.username, data.answer, data.sId);
    } );
    socket.on('response_rejected', function() {} );
    socket.on('notify_canvas_changed', function(data) {
      setCanvasData(data.image);
    });
    socket.on('game_info', function(data) {
 	    showNewGameModal(data.usernameDrawing, data.correctWas);
      isDrawing = data.sIdDrawing==socket.socket.sessionid;
      restartGame();
      setCanvasData(data.image);
    });
  });

  $("#closeNewGameModal").click( function() {
    $("#newGameModal").modal('hide');
  });

  $("#send_response_attempt").click( function() {
    answer = $("#response_attempt_input").val();
    socket.emit('send_response',{answer: answer});
    addAnswerAttempt(username, answer, null);
    $("#response_attempt_input").val("");
  });
  
  $("#drawing_zone").mouseup( function() {
    socket.emit('canvas_changed',{image: getCanvasData()});
  });

};

var showAskForUserDialog = function() {
  $('#usernameModal').modal({
    keyboard: false,
    backdrop: 'static',
    show: true
  });
}

var showNewGameModal = function(usernameDrawing, lastAnswer) {
	$('#newGameDescription').empty();
	if (lastAnswer != undefined) {
		$('#newGameDescription').append($("<div>").html("Last game response was: "+lastAnswer+"."));
	}
	$('#newGameDescription').append($("<div>").html("User drawing is: "+usernameDrawing+"."));
	$('#newGameModal').modal({
	  keyboard: true,
	  backdrop: true,
      show: true
    });
}

var addAnswerAttempt = function(username, answer, sId) {
  answerText = $("<span>").html(username+" : "+answer);

  itemToAdd = $("<div>");
  itemToAdd.append(answerText);

  if (isDrawing) {
    buttonAccept = $("<div>").addClass("btn btn-success").html("OK");
    buttonAccept.click(function() {
      socket.emit('accept_response', {sId: sId} );
    });
    buttonReject = $("<div>").addClass("btn btn-danger").html("NO");
    buttonReject.click(function() {
      socket.emit('reject_response', {sId: sId} );
    });

    itemToAdd.append(buttonAccept);
    itemToAdd.append(buttonReject);
  }

  $("#answer_list").append(itemToAdd);
};


var restartGame = function() {
  $("#answer_list").empty();
  if (isDrawing) {
    $('#drawing_zone').removeAttr('disabled');
    $('#drawing_zone').sketch();
    $('#attempt_response_block').hide();
    $('#drawing_notice').show();
  } else {
    $('#drawing_zone').attr('disabled', 'disabled');
    $('#attempt_response_block').show();
    $('#drawing_notice').hide();
  }
}

var getCanvasData = function() {
  var canvas = document.getElementById('drawing_zone');
  return canvas.toDataURL();
}

var setCanvasData = function(imgData) {
  var canvas = document.getElementById('drawing_zone');
  var ctx = canvas.getContext('2d');
  clearCanvas(canvas);
  if (imgData != undefined) {
    var receivedImage = new Image();
	  receivedImage.onload = function() {
      ctx.drawImage(receivedImage, 0, 0);
	  }
    receivedImage.src = imgData;
  }
}

var clearCanvas = function (canvas) {
  $("#drawing_zone").sketch().actions=[]
  var ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  $("#drawing_zone").sketch().draw();
}
