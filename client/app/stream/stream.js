'use strict';

angular.module('nodeAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('stream', {
        url: '/stream',
        templateUrl: 'app/stream/stream.html',
        controller: 'StreamCtrl'
      });
  });