'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope,socket) {

/****************************************************************************
 * Initial setup
 ****************************************************************************/
$scope.configuration = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
 };

var localStream, localPeerConnection, remotePeerConnection,
servers = null,
roomURL        = document.getElementById('url'),
localVideo = document.getElementById("localVideo"),
remoteVideo = document.getElementById("remoteVideo"),
startButton = document.getElementById("startButton"),
callButton = document.getElementById("callButton"),
answerButton = document.getElementById("answerButton"),
hangupButton = document.getElementById("hangupButton");

startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

startButton.onclick = start;
callButton.onclick = call;
answerButton.onclick = answer;
hangupButton.onclick = hangup;

// Create a random room if not already present in the URL.
var isInitiator,
room = window.location.hash.substring(1);
// if (!room) {
//   room = window.location.hash = randomToken;
//  };

/****************************************************************************
 * Signaling server
 ****************************************************************************/

socket.socket.on('ipaddr', function(ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
  updateRoomURL(ipaddr);
 });
socket.socket.on('created', function(room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId);
  isInitiator = true;
  // $scope.grabWebCamVideo();
 });
socket.socket.on('joined', function(room, clientId) {
  console.log('This peer has joined room', room, 'with client ID', clientId);
  $scope.isInitiator = false;
  // $scope.grabWebCamVideo();
 });
socket.socket.on('full', function(room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
 });
socket.socket.on('ready', function() {
  // $scope.createPeerConnection($scope.isInitiator, $scope.configuration);
 call();
 });
socket.socket.on('log', function(array) {
  console.log.apply(console, array);
 });
socket.socket.on('message', function(message) {
  console.log('Client received message:', message);
  $scope.signalingMessageCallback(message);
 });

// Join a room
socket.socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.socket.emit('ipaddr');
 }
/**
 * Send message to signaling server
 */
$scope.sendMessage = function(message) {
  console.log('Client sending message: ', message);
  socket.socket.emit('message', message);
 };

/**````````````````````````````
 * Updates URL on the page so that users can copy&paste it to their peers.
 */
 function updateRoomURL(ipaddr) {
  var url;
  if (!ipaddr) {
    url = location.href;
  } else {
    url = location.protocol + '//' + ipaddr + ':9000/#' + room;
  }
  roomURL.innerHTML = url;
 };

/****************************************************************************
 * User media (webcam)
 ****************************************************************************/
function trace(text) {
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
 }
function gotStream(stream){
  trace("Received local stream");
  localVideo.src = URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
 };
// $scope.grabWebCamVideo 			    = function () {
//   console.log('Getting user media (video) ...');
//   getUserMedia({
//     video: true,
//     audio: true
//   }, $scope.getMediaSuccessCallback, $scope.getMediaErrorCallback);
//  };
function getMediaSuccessCallback(stream){
  var streamURL = window.URL.createObjectURL(stream);
  console.log('getUserMedia video stream URL:', streamURL);
  window.stream = stream; // stream available to console
  localVideo.src = streamURL;
   trace('Received local stream');
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(localVideo, stream);
  localStream = stream;
   callButton.disabled = false;
 };
$scope.getMediaErrorCallback 	  = function (error) {
  console.log('getUserMedia error:', error);
 };
function start() {
  trace("Requesting local stream");
  startButton.disabled = true;
  getUserMedia({audio:true, video:true}, getMediaSuccessCallback,
    function(error) {
      trace("getUserMedia error: ", error);
    });
 };

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

$scope.signalingMessageCallback   = function (message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    $scope.peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
      $scope.logError);
    $scope.peerConn.createAnswer($scope.onLocalSessionCreated, $scope.logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    $scope.peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
      $scope.logError);

  } else if (message.type === 'candidate') {
    $scope.peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));

  } else if (message === 'bye') {
    // TODO: cleanup RTC connection?
  }
  }; 
function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  trace("Starting call");

  if (localStream.getVideoTracks().length > 0) {
    trace('Using video device: ' + localStream.getVideoTracks()[0].label);
  }
  if (localStream.getAudioTracks().length > 0) {
    trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
  }

  localPeerConnection = new RTCPeerConnection(servers);
  trace("Created local peer connection object localPeerConnection");
  localPeerConnection.onicecandidate = gotLocalIceCandidate;

  // remotePeerConnection = new RTCPeerConnection(servers);
  // trace("Created remote peer connection object remotePeerConnection");
  // remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  // remotePeerConnection.onaddstream = gotRemoteStream;

  localPeerConnection.addStream(localStream);
  trace("Added localStream to localPeerConnection");
  // localPeerConnection.createOffer(gotLocalDescription,handleError);
 };
function answer(){
  remotePeerConnection = new RTCPeerConnection(servers);
  trace("Created remote peer connection object remotePeerConnection");
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.onaddstream = gotRemoteStream;
   localPeerConnection.createOffer(gotLocalDescription,handleError);
 } ;
function gotLocalDescription(description){
  localPeerConnection.setLocalDescription(description);
  // trace("Offer from localPeerConnection: \n" + description.sdp);
  remotePeerConnection.setRemoteDescription(description);
  remotePeerConnection.createAnswer(gotRemoteDescription,handleError);
 };
function gotRemoteDescription(description){
  remotePeerConnection.setLocalDescription(description);
  trace("Answer from remotePeerConnection: \n" + description.sdp);
  localPeerConnection.setRemoteDescription(description);
 };
function hangup() {
  trace("Ending call");
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
 };
function gotRemoteStream(event){
  remoteVideo.src = URL.createObjectURL(event.stream);
  trace("Received remote stream");
 };
function gotLocalIceCandidate(event){
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Local ICE candidate: \n" + event.candidate.candidate);
  }
 };
function gotRemoteIceCandidate(event){
  if (event.candidate) {
    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Remote ICE candidate: \n " + event.candidate.candidate);
  }
 };
function handleError(){}


/****************************************************************************
 * Aux functions, mostly UI-related
 ****************************************************************************/
// $scope.sendStream           = function () {

//   var videoTracks = $scope.localStream.getVideoTracks();
//   var audioTracks = $scope.localStream.getAudioTracks();

//   if (videoTracks.length > 0)
//     trace('Using video device: ' + videoTracks[0].label);
//   if (audioTracks.length > 0)
//     trace('Using audio device: ' + audioTracks[0].label);

//   // $scope.dataChannel.send(videoTracks);
//    $scope.streamVideo(videoTracks);
//  };
// $scope.streamVideo          = function (data) {
//   var remoteVideo = document.createElement('canvas');
//   remoteVideo.classList.add('incomingVideo');
//   $scope.trail.insertBefore(remoteVideo, $scope.trail.firstChild);
//   var context = remoteVideo.getContext('2d');
//   $scope.peerConn.onaddstream = $scope.gotRemoteStream;
//  };
$scope.setCanvasDimensions 	= function () {
  if ($scope.video.videoWidth === 0) {
    setTimeout($scope.setCanvasDimensions, 200);
    return;
  }

  console.log('video width:', $scope.video.videoWidth, 'height:', $scope.video.videoHeight);

  $scope.photoContextW = $scope.video.videoWidth / 2;
  $scope.photoContextH = $scope.video.videoHeight / 2;
  //photo.style.width = photoContextW + 'px';
  //photo.style.height = photoContextH + 'px';
  // TODO: figure out right dimensions
  $scope.photoContextW = 300; //300;
  $scope.photoContextH = 150; //150;
 };
  });
function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
 };
function logError(err) {
  console.log(err.toString(), err);
 };