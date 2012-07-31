socketIds = []
usernames = {}
responses = {}
sIdDrawing = null
imgData = null
gameResignTimer = null

exports.onJoin = (socket, data) ->
  console.log("A new user: #{data.username} has miraculously joined")
  socketIds.push(socket.id)
  usernames[socket.id] = data.username
  setUserDrawing(socket, socket.id) if nobodyDrawing()
  emitGameInfo(socket)

exports.onDisconnect = (socket) ->
  console.log("User #{usernames[socket.id]} lost connection. Dropping.")
  forgetSocketId(socket.id)
  if (socket.id==sIdDrawing)
	  if(socketIds.length>0)
      chooseRandomPlayerToDraw(socket)
	  else
      clearGameData()

exports.onSendResponse = (socket, data) ->
  console.log("User sent response: #{data.answer}")
  socket.broadcast.emit('response_added', {
    sId : socket.id,
    username: usernames[socket.id],
    answer: data.answer
  })

exports.onAcceptResponse = (socket, data) ->
  console.log("User accepted response: #{data.sId}")
  socket.broadcast.emit('game_info', {sIdDrawing: data.sId, usernameDrawing: usernames[data.sId], correctWas: responses[data.sId]})
  socket.emit('game_info', {
    sIdDrawing: data.sId,
		usernameDrawing: usernames[data.sId],
		correctWas: responses[data.sId]})
  setUserDrawing(socket, data.sId)

exports.onRejectResponse = (socket, data) ->
  console.log("User rejected response: #{data.sId}")
  responses[data.sId] = null
  socket.broadcast.emit('response_rejected', {sId: data.sId})
  socket.emit('response_rejected', {sId: data.sId})

exports.onCanvasChange = (socket, data) ->
  imgData = data.image
  socket.broadcast.emit('notify_canvas_changed', {image: data.image})

setUserDrawing = (socket, sId) ->
  clearGameData()
  sIdDrawing = sId
  gameResignTimer = setTimeout( (-> resignGame(socket)) ,120000)
  console.log("User " + usernames[sId] + " is now drawing")

nobodyDrawing = ->
  sIdDrawing == null

emitGameInfo = (socket) ->
  socket.emit('game_info', {sIdDrawing: sIdDrawing, usernameDrawing: usernames[sIdDrawing], image: imgData })

chooseRandomPlayerToDraw = (socket) ->
	console.log("Selecting randomly next player to play")
	setUserDrawing(socket, pickRandomSocketId())
	emitGameInfo(socket.broadcast)
	emitGameInfo(socket)

pickRandomSocketId = ->
  randomSId = Math.floor(Math.random()*socketIds.length)
  return socketIds[randomSId]

forgetSocketId = (sId) ->
  socketIds.splice(socketIds.indexOf(sId),1)
  usernames[sId] = null
  responses[sId] = null

resignGame = (socket) ->
  console.log("Timeout. Creating a new game")
  chooseRandomPlayerToDraw(socket)

clearGameData = ->
  sIdDrawing = null
  imgData = null
  clearTimeout(gameResignTimer)
