'use strict';

describe('Controller: WebrtcCtrl', function () {

  // load the controller's module
  beforeEach(module('nodeAppApp'));

  var WebrtcCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WebrtcCtrl = $controller('WebrtcCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
