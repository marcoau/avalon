var http = require('http')
, url = require('url')
, fs = require('fs')
, path = require('path')
, express = require('express')
, jade = require('jade')
// , utils = require('/utilities/utils.js').utils
, app = express()
, server = http.createServer(app)
, io = require('socket.io').listen(server);

//have to listen on server, not app
server.listen(3000);

//load all static assets
app.use(express.static(path.normalize(__dirname + '/../client')));

app.use(function(req, res, next){
  console.log('Request type: ' + req.method + ', request url: ' + req.url);
  next();
});

app.get('/', function(req, res){
  var url = path.normalize(__dirname + '/../client/index.html');
  console.log(url);
  fs.readFile(url, function(err, data){
    console.log(data);
    res.send(200, data);
  });
  // res.redirect('/../client/index.html');
});

app.get('/lobby', function(req, res){
  var url = path.normalize(__dirname + '/../client/lobby.html');
  console.log(url);
  fs.readFile(url, function(err, data){
    console.log(data);
    res.send(200, data);
  });
  // res.redirect('/../client/index.html');
});

app.get('/login', function(req, res){
  var url = path.normalize(__dirname + '/../client/login.html');
  console.log(url);
  fs.readFile(url, function(err, data){
    console.log(data);
    res.send(200, data);
  });
  // res.redirect('/../client/index.html');
});

var userSockets = {};
var count = 0;

io.sockets.on('connection', function(socket){

  console.log(socket.id);

  socket.on('login', function(data){
    console.log('new player login');
    console.log(data);
    var username = data.username;
    count++;
    userSockets[username] = socket.id;
    io.sockets.emit('playerList', {users: userSockets});
  });

  socket.on('logout', function (data) {
    console.log('player logout');
    var username = data.username;
    count--;
    console.log('count: ' + count);
    console.log('user logout: ' + username);
    delete userSockets[username];
    console.log(userSockets);
    io.sockets.emit('playerList', {users: userSockets});
    //console.log(socket);
  }, this);

  socket.on('disconnect', function(socket){
    console.log('disconnected');
  });


});

// // setInterval(function(){
// //   //console.log(io.sockets);
// //   io.sockets.emit('spam', 'this is spam!');
// // }, 2000);

// // console.log(io.sockets.clients());
// io.sockets.on('connection', function (socket) {

//   // console.log(io.sockets.clients());

//   console.log(socket.id);
//   socket.send(socket.id);

//   socket.on('login', function (data) {
//     console.log('new user login');
//     var username = data.username;
//     count++;
//     console.log('count: ' + count);
//     console.log('New user is ' + username);
//     userSockets[username] = socket.id;
//     console.log(userSockets);
//     io.sockets.emit('respondUserList', {users: userSockets});
//     //console.log(socket);
//   }, this);

//   socket.on('logout', function (data) {
//     var username = data.username;
//     count--;
//     console.log('count: ' + count);
//     console.log('user logout: ' + username);
//     delete userSockets[username];
//     console.log(userSockets);
//     io.sockets.emit('respondUserList', {users: userSockets});
//     //console.log(socket);
//   }, this);

//   socket.on('sendMessage', function (data) {
//     console.log(data);
//     var message = data.message;
//     var from = data.from
//     var to = data.to;
//     console.log({message: message});
//     io.sockets.socket(to).emit('receiveMessage', {message: message, from: from});
//     //console.log(socket);
//   }, this);

//   socket.on('requestUserList', function(data) {
//     socket.emit('respondUserList', {users: userSockets});
//   });

// });

// io.sockets.on('disonnect', function (socket) {
//   console.log('disconnect');
// });

// //node.js event emitter/listener working

// app.on('myevent', function(){
//   console.log('on listener working');
// });

// app.emit('myevent');
