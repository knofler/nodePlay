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
     $("body").bind("mousemove",function(){
    
      var x=window.event.clientX;
      var y=window.event.clientY;
      socket.socket.emit("sendMouse",{data:{
        x:x,
        y:y
      }});
  // console.log("X co ordinate is " + x + " and y co ordinate is " + y)
});
    };
    
    $scope.modelx = [];
    $scope.modely = [];

    // socket.socket.emit("sendMouse",{data:'Rumman here'},function(res){
    //   console.info(res.data)
    // })

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });
