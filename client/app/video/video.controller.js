'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope) {

	$scope.button = document.querySelector("button");
    $scope.video = document.querySelector("video");
	$scope.constraints = {audio: false, video: true};
	$scope.canvas = document.querySelector("canvas");
	$scope.canvas.width = 480;
	$scope.canvas.height = 360;
	
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	$scope.button.onclick = function(){
	  $scope.canvas.getContext("2d").drawImage($scope.video, 0, 0, $scope.canvas.width, $scope.canvas.height);
		};
	$scope.successCallback = function (stream){
	  window.stream = stream; // stream available to console
	  if (window.URL) {
	    $scope.video.src = window.URL.createObjectURL(stream);
	  } else {
	    $scope.video.src = stream;
	  }
		};
	$scope.errorCallback = function (error){
	  console.log("navigator.getUserMedia error: ", error);
		};
	$scope.getVideo = function(){
		navigator.getUserMedia($scope.constraints, $scope.successCallback, $scope.errorCallback);
  		};

  });
