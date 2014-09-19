'use strict';

angular.module('nodeAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('websocket', {
        url: '/websocket',
        templateUrl: 'app/websocket/websocket.html',
        controller: 'WebsocketCtrl'
      });
  });