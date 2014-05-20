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
        $location.path('/login');
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

app.controller('lobbyController', ['$scope', 'Users', function($scope, Users){
  Users.load(function(data){
    console.log(Object.keys(data.users));
    $scope.$apply(function(){
      $scope.players = Object.keys(data.users);
    });
  });
  
  $scope.logout = function(){
    Users.logout();
  };
  // $scope.players = 'hehehe';
}]);

app.controller('gameController', ['$scope', 'Users', function($scope, Users){
  console.log('here');
  $scope.myself = Users.accessPlayerData()['myself'];
  $scope.others = Users.accessPlayerData()['others'];
}]);

app.controller('voteController', ['$scope', 'Users', function($scope, Users){
  console.log('here');
  $scope.myself = Users.accessPlayerData()['myself'];
  $scope.others = Users.accessPlayerData()['others'];
}]);
