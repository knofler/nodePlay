'use strict';

angular.module('nodeAppApp')
  .controller('ChatCtrl', function ($scope) {

  	/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
$scope.localConnection;
$scope.remotePeerConnection;
$scope.sendChannel; 
$scope.receiveChannel;
$scope.pcConstraint;
$scope.dataConstraint;
$scope.dataChannelSend 		= document.querySelector('textarea#dataChannelSend');
$scope.dataChannelReceive 	= document.querySelector('textarea#dataChannelReceive');
$scope.sctpSelect 			= document.querySelector('input#useSctp');
$scope.rtpSelect 			= document.querySelector('input#useRtp');
$scope.startButton 			= document.querySelector('button#startButton');
$scope.sendButton 			= document.querySelector('button#sendButton');
$scope.closeButton 			= document.querySelector('button#closeButton');

$scope.startButton.onclick 	= function () { $scope.createConnection(); };
$scope.sendButton.onclick 	= function () { $scope.sendData(); };
$scope.closeButton.onclick 	= function () { $scope.closeDataChannels(); };
$scope.rtpSelect.onclick 	= function () { $scope.enableStartButton(); };
$scope.sctpSelect.onclick 	= function () { $scope.enableStartButton(); };

$scope.enableStartButton = function () {
  $scope.startButton.disabled = false;
 };
$scope.disableSendButton = function () {
  $scope.sendButton.disabled = true;
 };

$scope.rtpSelect.onclick = $scope.sctpSelect.onclick = function() {
  $scope.dataChannelReceive.value = '';
  $scope.dataChannelSend.value = '';
  $scope.disableSendButton();
  $scope.enableStartButton();
 };

$scope.createConnection = function () {
  $scope.dataChannelSend.placeholder = '';
  var servers = null;
  $scope.pcConstraint = null;
  $scope.dataConstraint = null;
  if ($scope.sctpSelect.checked &&
     (webrtcDetectedBrowser === 'chrome' && webrtcDetectedVersion >= 31) ||
      webrtcDetectedBrowser === 'firefox'){
    // SCTP is supported from Chrome M31 and is supported in FF.
    // No need to pass DTLS constraint as it is on by default in Chrome M31.
    // For SCTP, reliable and ordered is true by default.
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
    // Data Channel api supported from Chrome M25.
    // You might need to start chrome with  --enable-data-channels flag.
    $scope.sendChannel = $scope.localConnection.createDataChannel('sendDataChannel', $scope.dataConstraint);
    trace('Created send data channel');
  } catch (e) {
    alert('Failed to create data channel. ' +
          'You need Chrome M25 or later with --enable-data-channels flag');
    trace('Create Data channel failed with exception: ' + e.message);
  }
  $scope.localConnection.onicecandidate = $scope.iceCallback1;
  $scope.sendChannel.onopen  			= $scope.onSendChannelStateChange;
  $scope.sendChannel.onclose 			= $scope.onSendChannelStateChange;

  $scope.remotePeerConnection = new RTCPeerConnection(servers, $scope.pcConstraint);
  trace('Created remote peer connection object remotePeerConnection');

  $scope.remotePeerConnection.onicecandidate = $scope.iceCallback2;
  $scope.remotePeerConnection.ondatachannel  = $scope.receiveChannelCallback;

  $scope.localConnection.createOffer($scope.gotDescription1, $scope.onCreateSessionDescriptionError);
  $scope.startButton.disabled = true;
  $scope.closeButton.disabled = false;
 };
$scope.onCreateSessionDescriptionError = function (error) {
  trace('Failed to create session description: ' + error.toString());
 };
$scope.sendData 					= function () {
  var data = $scope.dataChannelSend.value;
  $scope.sendChannel.send(data);
  trace('Sent Data: ' + data);
 };
$scope.closeDataChannels 			= function () {
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
  $scope.startButton.disabled = false;
  $scope.sendButton.disabled = true;
  $scope.closeButton.disabled = true;
  $scope.dataChannelSend.value = '';
  $scope.dataChannelReceive.value = '';
  $scope.dataChannelSend.disabled = true;
 };
$scope.gotDescription1 				= function (desc) {
  $scope.localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  $scope.remotePeerConnection.setRemoteDescription(desc);
  $scope.remotePeerConnection.createAnswer($scope.gotDescription2, $scope.onCreateSessionDescriptionError);
 };
$scope.gotDescription2 				= function (desc) {
  $scope.remotePeerConnection.setLocalDescription(desc);
  trace('Answer from remotePeerConnection \n' + desc.sdp);
  $scope.localConnection.setRemoteDescription(desc);
 };
$scope.iceCallback1 				= function (event) {
  trace('local ice callback');
  if (event.candidate) {
    $scope.remotePeerConnection.addIceCandidate(event.candidate,
                        $scope.onAddIceCandidateSuccess, $scope.onAddIceCandidateError);
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
 };
$scope.iceCallback2 				= function (event) {
  trace('remote ice callback');
  if (event.candidate) {
    $scope.localConnection.addIceCandidate(event.candidate,
                        $scope.onAddIceCandidateSuccess, $scope.onAddIceCandidateError);
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
 };
$scope.onAddIceCandidateSuccess 	= function () {
  trace('AddIceCandidate success.');
 };
$scope.onAddIceCandidateError 		= function (error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
 };
$scope.receiveChannelCallback 		= function (event) {
  trace('Receive Channel Callback');
  $scope.receiveChannel 			= event.channel;
  $scope.receiveChannel.onmessage 	= $scope.onReceiveMessageCallback;
  $scope.receiveChannel.onopen 		= $scope.onReceiveChannelStateChange;
  $scope.receiveChannel.onclose 	= $scope.onReceiveChannelStateChange;
 };
$scope.onReceiveMessageCallback 	= function (event) {
  trace('Received Message');
  $scope.dataChannelReceive.value = event.data;
 };
$scope.onSendChannelStateChange 	= function () {
  $scope.readyState = $scope.sendChannel.readyState;
  trace('Send channel state is: ' + $scope.readyState);
  if ($scope.readyState == 'open') {
    $scope.dataChannelSend.disabled = false;
    $scope.dataChannelSend.focus();
    $scope.sendButton.disabled = false;
    $scope.closeButton.disabled = false;
  } else {
    $scope.dataChannelSend.disabled = true;
    $scope.sendButton.disabled = true;
    $scope.closeButton.disabled = true;
  }
 };
$scope.onReceiveChannelStateChange 	= function () {
  $scope.readyState = $scope.receiveChannel.readyState;
  trace('Receive channel state is: ' + $scope.readyState);
 };







  });
