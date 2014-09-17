'use strict';

angular.module('nodeAppApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };
    $scope.sendSock =function(){
     $("body").bind("mousemove",function(evt){
      socket.socket.emit("sendMouse",evt.pageX,evt.pageY);
      });
    };

    $scope.spy =function(move){
      $scope.spy_marker.show().css({
        left:(move.x -2) + "px",
        right:(move.y -2) + "px"
      });
     };

    socket.socket.on("sendMouse",function(move){
       $("#spy_marker").show().css({
        left:(move.x -2) + "px",
        right:(move.y -2) + "px"
      });
        console.log("x is " + move.x  +" and y is " + move.y );
    }
      // $scope.spy
      );

    $scope.spy_marker = $("#spy_marker");

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });
