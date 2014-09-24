'use strict';

angular.module('nodeAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('fileshare', {
        url: '/fileshare',
        templateUrl: 'app/fileshare/fileshare.html',
        controller: 'FileshareCtrl'
      });
  });