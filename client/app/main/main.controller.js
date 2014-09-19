'use strict';

angular.module('nodeAppApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
      };
    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
      };
      
  });
