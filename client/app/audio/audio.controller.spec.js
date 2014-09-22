'use strict';

describe('Controller: AudioCtrl', function () {

  // load the controller's module
  beforeEach(module('nodeAppApp'));

  var AudioCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AudioCtrl = $controller('AudioCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
