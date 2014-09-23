'use strict';

angular.module('nodeAppApp')
  .controller('AudioCtrl', function ($scope) {

  	//Stream variables to capture stream binary
  	$scope.stream;
  	$scope.localStream;
  	// Audio Context variable
  	$scope.audioContext;

  	//Document element selectors
  	$scope.audioRecord 		  = document.querySelector("#audioRecord");
  	$scope.audioPlay 		  = document.querySelector("#audioPlay");

  	//access current audioplay properties directly from API
  	$scope.showCurrentTime;

  	//Custom start stop and other button element selector
  	$scope.recordButton 	  = document.querySelector("button#recordStart");
	$scope.stopRecordButton   = document.querySelector("button#recordStop");
	$scope.playStartButton 	  = document.querySelector("button#playStart");
	$scope.playPauseButton 	  = document.querySelector("button#playPause");
	$scope.playSupportButton  = document.querySelector("button#playStop");

	//Define Audio constraints for customized options
  	$scope.audioConstraints = {audio:true,video:false};  
  	
  	//Volume control
	$scope.reporter;
  	
	//instantiate class variable
  	$scope.soundMeter;

  	//Set appropriate type of getUserMedia()
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	//SoundMeter Class Definition

	// Meter class that generates a number correlated to audio volume.
 	// The meter class itself displays nothing, but it makes the
 	// instantaneous and time-decaying volumes available for inspection.
 	// It also reports on the fraction of samples that were at or near
 	// the top of the measurement range.
  	$scope.SoundMeter = function(context) {
	    this.context = context
	    this.volume = 0.0;
	    this.slow_volume = 0.0;
	    this.clip = 0.0;
	    this.script = context.createScriptProcessor(2048, 1, 1);
	    var that = this;
	    this.script.onaudioprocess = function(event) {
	      var input = event.inputBuffer.getChannelData(0);
	      var i;
	      var sum = 0.0;
	      var clipcount = 0;
	      for (i = 0; i < input.length; ++i) {
	        sum += input[i] * input[i];
	        if (Math.abs(input[i]) > 0.99) {
	          clipcount += 1
	        }
	      }
	      that.volume = Math.sqrt(sum / input.length);
	      that.slow_volume = 0.95 * that.slow_volume + 0.05 * that.volume;
	      that.clip = clipcount / input.length;
	    }
     };
	$scope.SoundMeter.prototype.connectToSource = function(stream) {
     	console.log('SoundMeter connecting');
    	this.mic = this.context.createMediaStreamSource(stream);
    	this.mic.connect(this.script);
	    // Necessary to make sample run, but should not be.
	    this.script.connect(this.context.destination);
	  };
	$scope.SoundMeter.prototype.stop = function() {
	    this.mic.disconnect();
	    this.script.disconnect();
	  }; 

    //Audio Stream call back and error handling	
	$scope.gotAudioStream =function(stream) {
	   var videoTracks = stream.getVideoTracks();
	   var audioTracks = stream.getAudioTracks();
	    if (audioTracks.length == 1 && videoTracks.length == 0) {
	      console.log('gotStream({audio:true, video:false})');
	      console.log('Using audio device: ' + audioTracks[0].label);
	      attachMediaStream($scope.audioRecord, stream);
	      stream.onended = function() {
	        console.log('stream.onended');
	        $scope.recordButton.disabled = false;
	        $scope.stopRecordButton.disabled = true;
	      };
	      $scope.localStream = stream;

	    //instantiate SoundMeter Class
		$scope.soundMeter = new $scope.SoundMeter($scope.audioContext);    
	      
	    //execute connectToSource method from SoundMeter Object
      	$scope.soundMeter.connectToSource(stream);
	    
	    // Set up reporting of the volume every 0.2 seconds.
	    //Volume meter display
		var meter 		  	= $('volume'),
			decaying_meter 	= $('decaying_volume'),
	    	meter_canvas   	= document.querySelector("canvas#graphic_volume").getContext('2d'),
			meter_slow 	  	= document.querySelector("canvas#graphic_slow").getContext('2d'),
			meter_clip 	  	= document.querySelector("canvas#graphic_clip").getContext('2d');

	    $scope.reporter = setInterval(function() {
          meter.textContent 	= $scope.soundMeter.volume.toFixed(2);
          decaying_meter.textContent = $scope.soundMeter.slow_volume.toFixed(2);
          $scope.paintMeter(meter_canvas, $scope.soundMeter.volume);
          $scope.paintMeter(meter_slow, $scope.soundMeter.slow_volume);
          $scope.paintMeter(meter_clip, $scope.soundMeter.clip);
	     }, 200);

	    } else {
	      alert('The media stream contains an invalid number of tracks:'
	         + audioTracks.length + ' audio ' + videoTracks.length + ' video');
	      stream.stop();
    	}
  	 };
	$scope.audioStreamFailed =function(error) {
	    $scope.recordButton.disabled = false;
	    $scope.stopRecordButton.disabled = true;
	    alert('Failed to get access to local media. Error code: ' + error.code);
 	 }; 	  
	$scope.paintMeter = function(context, number) {
     context.clearRect(0, 0, 400, 20);
     context.fillStyle = 'red';
     context.fillRect(0, 0, number * 400, 20);
  	 };    

	//Local audio media for record and loop back start and stop control
	$scope.recordStart = function (){
	  navigator.getUserMedia($scope.audioConstraints,$scope.gotAudioStream,$scope.audioStreamFailed);
	   $scope.recordButton.disabled = true;
       $scope.stopRecordButton.disabled = false;
	 }; 
	$scope.recordStop = function (){
	   $scope.recordButton.enabled = true;
       $scope.stopRecordButton.enabled = false;
	   $scope.localStream.stop();
	   clearInterval($scope.reporter);
       $scope.soundMeter.stop();
	 }; 

	//Play Local audio media start ,stop, pause and other control  
  	$scope.playPause = function(){
  		$scope.audioPlay.pause();
  	 };
  	$scope.playStart = function(){
  		$scope.audioPlay.play();
  	 };
  	$scope.playStop = function(){
  		$scope.audioPlay.pause();
  		$scope.audioPlay.currentTime = 0;
  	 };
  	$scope.supportType = function(vidType,codType){
  		var answer = $scope.audioPlay.canPlayType(vidType+';codecs="'+codType+'"');
 		document.querySelector("#resultDiv").innerHTML = "<hr><p> Result of canPlayType is : <b>" + angular.uppercase(answer)+"</b></p>";
  	 }; 
  	$scope.bufferedInfo = function(){
  		var start,end,length;
  		start = $scope.audioPlay.buffered.start(0);
  		end = $scope.audioPlay.buffered.end(0);
  		document.querySelector("#resultDiv").innerHTML = "<hr><p> Buffered started at  : <b>" +start+"</b> Ended at <b>" + end + " </b></p>";
  	 };
  	$scope.mediaSource = function(){
  		var src= $scope.audioPlay.currentSrc;
  		document.querySelector("#resultDiv").innerHTML = "<hr><p> Current media source is  : <b>" +src+"</b></p>";
  	 }; 


  	//Web Audio Events
  		$scope.audioPlay.addEventListener('timeupdate',function(){
  		$scope.showCurrentTime = $scope.audioPlay.currentTime ;
  		document.querySelector("#audioInfo").innerHTML = "<p>Current Media time is : <span> <b>" + $scope.showCurrentTime +"</b></span></p>";
  		// console.log($scope.showCurrentTime)
  	  });
  	


 	//Audio Context onLoad Event
	$scope.onload = function() {
	 try {
	      window.AudioContext = window.AudioContext || window.webkitAudioContext;
	      $scope.audioContext = new AudioContext();
	    } catch(e) {
	     console.log('Web Audio API not found');
	    }
	 };   


  });