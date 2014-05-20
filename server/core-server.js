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

//THESE SHOULD NOT BE GLOBAL!!!!
var count = 0;
var rejectedTeam = 0;
var missionNumber = 1;
var succeededMission = 0;
var failedMission = 0;
var leaderPos = 0;

var approveVotes = 0;
var rejectVotes = 0;
var pickedTeam = [];
var pickedTeamName = [];

var players = {};
var playersArr = [];

// setTimeout(function(){
//   console.log(playersArr)
// }, 10000);

var shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var allSockets = io.sockets;

io.sockets.on('connection', function(socket){

  //update sockets of all players - works!
  allSockets = io.sockets;

  //This should REALLY NOT be here
  var mission = function(team){
    var success = 0;
    var fail = 0;
    console.log('hey mission!');
    for(var i = 0; i < team.length; i++){
      io.sockets.socket(team[i]['socket']).on('wentOnMission', function(data){
        data.success ? success++ : fail++;
        console.log('went on mission');
        if(success + fail === team.length){
          if(fail > 0){
            failedMission++;
            console.log('mission failed');
            //###allSockets
            allSockets.emit('updateMissionTally', {success: false});
          }else{
            succeededMission++;
            console.log('mission succeeded');
            //###allSockets
            allSockets.emit('updateMissionTally', {success: true});
          }

          //Endgame check
          if(succeededMission > 2){
            //Good Wins!
            console.log('good prevails!');
          }else if(failedMission > 2){
            //Evil Wins!
            console.log('evil wins!');
          }

          missionNumber++;
          leaderPos++;
          voting(leaderPos);

        }
      });
      console.log(team[i]);
      io.sockets.socket(team[i]['socket']).emit('goOnMission');
    }
  };

  socket.on('voted', function(data){
    console.log('vote received');
    if(data.approve){
      approveVotes++;
    }else{
      rejectVotes++;
    }
    if(approveVotes + rejectVotes === count){
      if(approveVotes > rejectVotes){
        console.log('Team approved: ' + approveVotes + ':' + rejectVotes);
        rejectedTeam = 0;
        //BECAREFUL!!!
        //
        //
        //
        allSockets.emit('updateTeamTally', {count: rejectedTeam});
        //
        console.log('the team: ');
        console.log(pickedTeam);
        mission(pickedTeam);
      }else{
        console.log('Team rejected: ' + approveVotes + ':' + rejectVotes);
        rejectedTeam++;
        //###allSockets
        allSockets.emit('updateTeamTally', {count: rejectedTeam});
        leaderPos++;
        voting(leaderPos);
      }
    }
  });
  
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
    voting(leaderPos);
  };

  var voting = function(pos){
    missionNumber++;
    var realPos = pos % count;
    console.log('pos: ' + pos + ', realPos: ' + realPos);
    console.log(playersArr);
    if(rejectedTeam > 4){
      console.log('auto lose for good guys');
      //bad guys win!

    }
    // var pos = 0;
    //WTF
    pickedTeam = [];
    pickedTeamName = [];
    console.log(pickedTeam);
    console.log(pickedTeamName);
    //kick start process, to be refactored!!!
    if(pos === 0){
      io.sockets.socket(playersArr[realPos]['socket']).on('readyGame', function(){
        io.sockets.socket(playersArr[realPos]['socket']).emit('chooseTeam');
      });      
    }else{
      io.sockets.socket(playersArr[realPos]['socket']).emit('chooseTeam');
    }

    io.sockets.socket(playersArr[realPos]['socket']).on('pickedTeam', function(data){
      console.log(data.team);
      for(var player in data.team){
        pickedTeam.push(data.team[player]);
        pickedTeamName.push(data.team[player].name);
      }
      //broadcast
      console.log(pickedTeamName);
      approveVotes = 0;
      rejectVotes = 0;

      //???
      // io.sockets.on('voted', function(data){
      //   console.log('vote received');
      //   if(data.approve){
      //     approveVotes++;
      //   }else{
      //     rejectVotes++;
      //   }
      //   if(approveVotes + rejectVotes === count){
      //     if(approveVotes > rejectVotes){
      //       console.log('Team approved: ' + approveVotes + ':' + rejectVotes);
      //       //
      //       mission(pickedTeam);
      //     }else{
      //       console.log('Team rejected: ' + approveVotes + ':' + rejectVotes);
      //       rejectedTeam++;
      //       voting(1);
      //     }
      //   }
      // });
      //

      //###allSockets
      allSockets.emit('voteForTeam', {team: pickedTeamName});
    });
  };



  console.log(socket.id);

  socket.on('login', function(data){
    console.log('new player login');
    // allSockets.emit('testing');
    console.log(data);
    var username = data.username;
    count++;
    userSockets[username] = socket.id;
    io.sockets.emit('playerList', {users: userSockets});
    if(count > 3){
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
    allSockets = io.sockets;
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
