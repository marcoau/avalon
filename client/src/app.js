var app = angular.module('avalon', ['ngRoute']);


app.config(['$routeProvider', function($routeProvider){
  $routeProvider
  .when('/login', {
    templateUrl: '/login',
    controller: 'inputController'
  })
  .when('/lobby', {
    templateUrl: '/lobby',
    controller: 'lobbyController'
  })
  .when('/game', {
    templateUrl: '/game',
    controller: 'gameController'
  }).otherwise({redirectTo: '#'});
}]);


app.factory('Users', ['$http', '$location', '$rootScope', function($http, $location, $rootScope){
  var _username = undefined;
  var _loggedin = false;
  var myselfInfo = undefined;
  var othersInfo = undefined;
  var gameStatus = {
    round: undefined,
    results: []
  };
  return {
    login: function(username){
      _username = username;
      _loggedin = true;
      console.log(_username);
      $location.path('/lobby');
    },

    load: function(callback){
      console.log(_username);
      $rootScope.socket = io.connect('http://localhost:3000');
      $rootScope.socket.emit('login', {username: _username});
      console.log($rootScope.socket);
      $rootScope.socket.on('playerList', function(data){
        callback(data);
      });
      $rootScope.socket.on('startGame', function(data){
        console.log(data);
        myselfInfo = data.myself;
        othersInfo = data.others;
        console.log(myselfInfo);
        console.log(othersInfo);
        // $location.path('/login');
      });
      // console.log('you\'re login, hahaha!jk');
    },

    //temp
    // loadGame: function(){
    //   console.log('here');
    //   $location.path('/game');
    // },

    accessPlayerData: function(){
      return {
        myself: myselfInfo,
        others: othersInfo
      };
    },

    logout: function(){
      $rootScope.socket.emit('logout', {username: _username});
      // $rootScope.socket.disconnect();
      _username = undefined;
      _loggedin = false;
      $location.path('/');
      console.log($rootScope.socket);
    }
  };
}]);

app.controller('inputController', ['$scope', 'Users', function($scope, Users){
  $scope.login = function(){
    Users.login($scope.username);
  };
}]);

app.controller('lobbyController', ['$rootScope', '$scope', 'Users', function($rootScope, $scope, Users){

  //testing


  Users.load(function(data){
    console.log(Object.keys(data.users));
    $scope.$apply(function(){
      $scope.players = Object.keys(data.users);
    });
  });
  // $rootScope.socket.on('testing', function(){
  //   console.log('tested');
  // });
  
  $scope.logout = function(){
    Users.logout();
  };
  // $scope.players = 'hehehe';
}]);

app.controller('gameController', ['$rootScope', '$scope', 'Users', function($rootScope, $scope, Users){
  console.log('here');
  $scope.isLeader = false;
  $scope.votingTime = false;
  $scope.onMission = false;
  $scope.succeededMissionCount = 0;
  $scope.failedMissionCount = 0;
  $scope.rejectedTeamCount = 0;

  $rootScope.socket.on('updateMissionTally', function(data){
    if(data.success){
      $scope.succeededMissionCount++;
    }else{
      $scope.failedMissionCount++;
    }
  });

  $rootScope.socket.on('updateTeamTally', function(data){
    $scope.rejectedTeamCount = data.count;
  });

  $rootScope.socket.on('chooseTeam', function(){
    console.log('you are leader!');
    $scope.$apply(function(){
      $scope.isLeader = true;
      //to be refactored!
      $rootScope.leaderDuties = {
        pick: function(player){
          console.log('pick');
          $rootScope.leaderDuties.list.push(player);
        },
        unpick: function(player){
          $rootScope.leaderDuties.list.splice($rootScope.leaderDuties.list.indexOf(player), 1);
        },
        sendTeam: function(){
          $rootScope.socket.emit('pickedTeam', {team: $rootScope.leaderDuties.list});
          $scope.isLeader = false;
          $rootScope.leaderDuties = undefined;
        },
        list: []
      };
    });
  });

  $rootScope.socket.on('voteForTeam', function(data){
    $scope.$apply(function(){
      $scope.votingTime = true;
      $scope.proposedTeam = data.team;
      console.log($scope.proposedTeam);
      //to be refactored!
      $rootScope.voterDuties = {
        approve: function(){
          $rootScope.socket.emit('voted', {approve: true});
          //
          $scope.votingTime = false;
          $rootScope.voterDuties = undefined;
        },
        reject: function(){
          $rootScope.socket.emit('voted', {approve: false});
          //
          $scope.votingTime = false;
          $rootScope.voterDuties = undefined;
        }
      }
    });
  });

  $rootScope.socket.on('goOnMission', function(data){
    console.log('go on mission!!!!');
    $scope.$apply(function(){
      $scope.onMission = true;
      $rootScope.missionDuties = {
        success: function(){
          $rootScope.socket.emit('wentOnMission', {success: true});
          $scope.onMission = false;
          $rootScope.missionDuties = undefined;
        },
        fail: function(){
          $rootScope.socket.emit('wentOnMission', {success: false});
          $scope.onMission = false;
          $rootScope.missionDuties = undefined;
        }
      }
    });
  });

  $rootScope.socket.emit('readyGame');
  $scope.myself = Users.accessPlayerData()['myself'];
  $scope.others = Users.accessPlayerData()['others'];
}]);

app.controller('voteController', ['$scope', 'Users', function($scope, Users){

}]);
