'use strict';

angular.module('nodeAppApp')
  .controller('ChatCtrl', function ($scope,socket){

$scope.localConnection;
$scope.remotePeerConnection;
$scope.sendChannel; 
$scope.receiveChannel;
$scope.pcConstraint;
$scope.dataConstraint;
$scope.dataChannelSend 		 = document.querySelector('textarea#dataChannelSend');
$scope.dataChannelReceive  = document.querySelector('textarea#dataChannelReceive');
$scope.sctpSelect 			   = document.querySelector('input#useSctp');
$scope.rtpSelect 			     = document.querySelector('input#useRtp');

$scope.enableSendClose = true;
$scope.ctrlStart       = false;

$scope.createConnection                = function () {
  $scope.dataChannelSend.placeholder = '';
  var servers           = null;
  $scope.pcConstraint   = null;
  $scope.dataConstraint = null;

  if ($scope.sctpSelect.checked &&
   (webrtcDetectedBrowser === 'chrome' && webrtcDetectedVersion >= 31) ||
    webrtcDetectedBrowser === 'firefox'){
   trace('Using SCTP based Data Channels');
   } else {
    $scope.pcConstraint = {optional: [{RtpDataChannels: true}]};
    if (!$scope.rtpSelect.checked) {
      // Use rtp data channels for chrome versions older than M31.
      trace('Using RTP based Data Channels,' +
            'as you are on an older version than M31.');
      alert('Reverting to RTP based data channels,' +
            'as you are on an older version than M31.');
      $scope.rtpSelect.checked = true;
    }
  }
  $scope.localConnection = new RTCPeerConnection(servers, $scope.pcConstraint);
  trace('Created local peer connection object localConnection');
  try {
    $scope.sendChannel = $scope.localConnection.createDataChannel('sendDataChannel', $scope.dataConstraint);
    trace('Created send data channel');
  } catch (e) {
    alert('Failed to create data channel. ' +
          'You need Chrome M25 or later with --enable-data-channels flag');
    trace('Create Data channel failed with exception: ' + e.message);
  }
  $scope.localConnection.onicecandidate = $scope.iceCallback1;
  $scope.sendChannel.onopen  			      = $scope.onSendChannelStateChange;
  $scope.sendChannel.onclose 			      = $scope.onSendChannelStateChange;

  $scope.remotePeerConnection = new RTCPeerConnection(servers, $scope.pcConstraint);
  trace('Created remote peer connection object remotePeerConnection');

  $scope.remotePeerConnection.onicecandidate = $scope.iceCallback2;
  $scope.remotePeerConnection.ondatachannel  = $scope.receiveChannelCallback;

  $scope.localConnection.createOffer($scope.gotDescription1, $scope.onCreateSessionDescriptionError);
  $scope.ctrlStart       = true;
  $scope.enableSendClose =false;
 };
$scope.sendData 					             = function () {
  var data = $scope.dataChannelSend.value;
  $scope.sendChannel.send(data);
  socket.socket.emit('sendData',{msg : data});
  
  trace('Sent Data: ' + data);
 };
$scope.closeDataChannels 			         = function () {
  trace('Closing data Channels');
  $scope.sendChannel.close();
  trace('Closed data channel with label: ' + $scope.sendChannel.label);
  $scope.receiveChannel.close();
  trace('Closed data channel with label: ' + $scope.receiveChannel.label);
  $scope.localConnection.close();
  $scope.remotePeerConnection.close();
  $scope.localConnection = null;
  $scope.remotePeerConnection = null;
  trace('Closed peer connections');
  $scope.ctrlStart = false;
  $scope.enableSendClose =true;
  $scope.dataChannelSend.value = '';
  $scope.dataChannelReceive.value = '';
  $scope.dataChannelSend.disabled = true;
 };
$scope.gotDescription1 				         = function (desc) {
  $scope.localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  $scope.remotePeerConnection.setRemoteDescription(desc);
  $scope.remotePeerConnection.createAnswer($scope.gotDescription2, $scope.onCreateSessionDescriptionError);
 };
$scope.gotDescription2 				         = function (desc) {
  $scope.remotePeerConnection.setLocalDescription(desc);
  trace('Answer from remotePeerConnection \n' + desc.sdp);
  $scope.localConnection.setRemoteDescription(desc);
 };
$scope.iceCallback1 				           = function (event) {
  trace('local ice callback');
  if (event.candidate) {
    $scope.remotePeerConnection.addIceCandidate(event.candidate,
                        $scope.onAddIceCandidateSuccess, $scope.onAddIceCandidateError);
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
 };
$scope.iceCallback2 				           = function (event) {
  trace('remote ice callback');
  if (event.candidate) {
    $scope.localConnection.addIceCandidate(event.candidate,
                        $scope.onAddIceCandidateSuccess, $scope.onAddIceCandidateError);
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
 };
$scope.receiveChannelCallback 		     = function (event) {
  trace('Receive Channel Callback');
  $scope.receiveChannel 			    = event.channel;
  $scope.receiveChannel.onmessage = $scope.onReceiveMessageCallback;
  $scope.receiveChannel.onopen 		= $scope.onReceiveChannelStateChange;
  $scope.receiveChannel.onclose 	= $scope.onReceiveChannelStateChange;
 };
$scope.onAddIceCandidateSuccess        = function () {
  trace('AddIceCandidate success.');
 };
$scope.onCreateSessionDescriptionError = function (error) {
  trace('Failed to create session description: ' + error.toString());
 }; 
$scope.onAddIceCandidateError          = function (error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
 }; 
$scope.onReceiveMessageCallback 	     = function (event) {
  trace('Received Message');
  $scope.dataChannelReceive.value = event.data;
 };
$scope.onSendChannelStateChange 	     = function () {
  $scope.readyState = $scope.sendChannel.readyState;
  trace('Send channel state is: ' + $scope.readyState);
  if ($scope.readyState == 'open') {
    $scope.dataChannelSend.disabled = false;
    $scope.dataChannelSend.focus();
    $scope.enableSendClose = false;
  } else {
    $scope.dataChannelSend.disabled = true;
    $scope.enableSendClose = true;
  }
 };
$scope.onReceiveChannelStateChange 	   = function () {
  $scope.readyState = $scope.receiveChannel.readyState;
  trace('Receive channel state is: ' + $scope.readyState);
 };

  socket.socket.on('chat',function(data){
    console.log("I have got the " + data.srvmsg);
  });
  
});
