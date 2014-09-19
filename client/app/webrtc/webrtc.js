'use strict';

angular.module('nodeAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('webrtc', {
        url: '/webrtc',
        templateUrl: 'app/webrtc/webrtc.html',
        controller: 'WebrtcCtrl'
      });
  });