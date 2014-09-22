'use strict';

angular.module('nodeAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('audio', {
        url: '/audio',
        templateUrl: 'app/audio/audio.html',
        controller: 'AudioCtrl'
      });
  });