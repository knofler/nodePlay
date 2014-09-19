'use strict';

describe('Controller: WebsocketCtrl', function () {

  // load the controller's module
  beforeEach(module('nodeAppApp'));

  var WebsocketCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WebsocketCtrl = $controller('WebsocketCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
