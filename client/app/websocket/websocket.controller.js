'use strict';

angular.module('nodeAppApp')
  .controller('WebsocketCtrl', function ($scope, $http, socket) {
   $scope.spy_marker = $("#spy_marker");

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
      });

    
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

    socket.socket.on("sendMouse",$scope.spy);
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
      });
  });
