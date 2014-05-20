var http = require('http')
, url = require('url')
, fs = require('fs')
, path = require('path')
, express = require('express')
, jade = require('jade')
, _ = require('underscore')
, utils = require('./utils').utils
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

app.get('/', function(req, res){ utils.loadClient(req, res, 'index.html'); });
app.get('/lobby', function(req, res){ utils.loadClient(req, res, 'lobby.html'); });
app.get('/login', function(req, res){ utils.loadClient(req, res, 'login.html'); });
app.get('/game', function(req, res){ utils.loadClient(req, res, 'game.html'); });

var userSockets = {};
var count = 0;

var shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

io.sockets.on('connection', function(socket){

  var players = {};
  var playersArr = [];
  var genCharacter = function(){
    return shuffle(['merlin', 'percival', 'warrior', 'mordred', 'villain', 'villain']);
  };

  var startGame = function(){
    console.log('start game');
    var characters = genCharacter();
    var i = 0;
    for(key in userSockets){
      players[key] = {
        name: key,
        socket: userSockets[key],
        character: characters[i]
      };
      playersArr.push(players[key]);
      // console.log('Player ' + (i+1) + ' - ' + key + ', is ' + players[key]['character']);
      i++;
    }
    sendIdentity();
  };

  var playerInfo = function(player){
    return player.name + ' is ' + player.character + '\n';
  };

  var sendIdentity = function(){
    for(var player in players){
      console.log(player);
      var info = {myself:{}, others:{}};
      for(var key in players){
        if(key === player){
          info['myself'] = {
            name: players[key]['name'],
            socket: players[key]['socket'],
            character: players[key]['character'],
          }
        }else{
          info['others'][key] = {
            name: players[key]['name'],
            socket: players[key]['socket'],
            character: players[key]['character'],
          };
        };
      }
      console.log(player);
      for(var infoPlayer in info['others']){
        if(players[player]['character'] === 'merlin' && 
          info['others'][infoPlayer]['character'] !== 'villain'){
          //case for merlin
          info['others'][infoPlayer]['character'] = 'unknown';
        }else if(players[player]['character'] === 'percival' &&
          info['others'][infoPlayer]['character'] !== 'merlin'){
          //case for percival
          info['others'][infoPlayer]['character'] = 'unknown';
        }else if((players[player]['character'] === 'villain' || players[player]['character'] === 'mordred') &&
          info['others'][infoPlayer]['character'] !== 'villain' && info['others'][infoPlayer]['character'] !== 'mordred'){
          //case for villain or mondred
          info['others'][infoPlayer]['character'] = 'unknown';
        }else if(players[player]['character'] === 'warrior'){
          info['others'][infoPlayer]['character'] = 'unknown';
        }
      }
      console.log('player data:');
      console.log(players);
      console.log('data for ' + player);
      console.log(info);

      io.sockets.socket(players[player]['socket']).emit('startGame', info);
    }
  };

  // var voting = function(){
  //   var pos = 0;
  //   //kick start process
  //   io.sockets.socket(playersArr[pos]['socket']).emit('chooseTeam');
  //   io.sockets.socket.on('pickedTeam', function(){
  //     //broadcast
  //   });
  // };

  console.log(socket.id);

  socket.on('login', function(data){
    console.log('new player login');
    console.log(data);
    var username = data.username;
    count++;
    userSockets[username] = socket.id;
    io.sockets.emit('playerList', {users: userSockets});
    if(count > 5){
      startGame();
    }
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
