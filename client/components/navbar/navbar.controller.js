'use strict';

angular.module('nodeAppApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [
      {'title': 'Home','link': '/'},
      {'title': 'File Share','link': '/fileshare'},
      {'title': 'Stream','link': '/stream'},
      {'title': 'Video','link': '/video'},
      {'title': 'Audio','link': '/audio'},
      {'title': 'websocket','link': '/websocket'},
      {'title': 'webrtc','link': '/webrtc'},
      {'title': 'chat','link': '/chat'}
    ];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });