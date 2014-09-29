'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope,socket) {

/****************************************************************************
 * Initial setup
 ****************************************************************************/
var configuration = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
 };
var sdpConstraints = {
  'mandatory': {
    'OfferToReceiveAudio': true,
    'OfferToReceiveVideo': true
  }
  }; 

var localStream, localPeerConnection, remotePeerConnection,
servers = null,
roomURL        = document.getElementById('url'),
trail          = document.getElementById('trail'),

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
  isInitiator = false;
  // $scope.grabWebCamVideo();
 });
socket.socket.on('full', function(room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
 });
socket.socket.on('ready', function() {
  // $scope.createPeerConnection($scope.isInitiator, $scope.configuration);
 // call();
 });
socket.socket.on('log', function(array) {
  console.log.apply(console, array);
 });
socket.socket.on('message', function(message) {
  console.log('Client received message:', message);
  // signalingMessageCallback(message);
 });

// Join a room
socket.socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.socket.emit('ipaddr');
 }
/**
 * Send message to signaling server
 */
function sendMessage (message) {
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
 };
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
function getMediaErrorCallback(error) {
  console.log('getUserMedia error:', error);
 };
function start() {
  trace("Requesting local stream");
  startButton.disabled = true;
  getUserMedia({audio:true, video:true}, getMediaSuccessCallback,getMediaErrorCallback);
 };

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    remotePeerConnection.setRemoteDescription(new RTCSessionDescription(message), function() {},
      logError);
    remotePeerConnection.createAnswer(gotRemoteDescription,logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    remotePeerConnection.setRemoteDescription(new RTCSessionDescription(message), function() {},
      logError);

  } else if (message.type === 'candidate') {
    localPeerConnection.addIceCandidate(new RTCIceCandidate({
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
  // startTime = performance.now();
  
  var videoTracks = localStream.getVideoTracks();
  var audioTracks = localStream.getAudioTracks();
  
  if (videoTracks.length > 0)
    trace('Using video device: ' + videoTracks[0].label);
  if (audioTracks.length > 0)
    trace('Using audio device: ' + audioTracks[0].label);
  
  var servers = null;
  
  localPeerConnection = new RTCPeerConnection(servers);
  trace("Created local peer connection object localPeerConnection");
  // send Local ice candidates to the remote peer
  localPeerConnection.onicecandidate = gotLocalIceCandidate;

  remotePeerConnection = new RTCPeerConnection(servers);
  trace("Created Remote peer connection object remotePeerConnection");
  // send Local ice candidates to the remote peer
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
 
  localPeerConnection.oniceconnectionstatechange = function(e) { onIceStateChange('localPeerConnection', e) };
  remotePeerConnection.oniceconnectionstatechange = function(e) { onIceStateChange('remotePeerConnection', e) };
  
  remotePeerConnection.onaddstream = gotRemoteStream;

  localPeerConnection.addStream(localStream);
  trace('Added local stream to localPeerConnection');

  trace('localPeerConnection createOffer start');
  localPeerConnection.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError);
 };

function answer(){
  answerButton.disabled = true;
  hangupButton.disabled = false;
  trace("Answering call");

  remotePeerConnection = new RTCPeerConnection(servers);
  trace("Created remote peer connection object remotePeerConnection");
  
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  trace("Added RemoteStream to RemotePeerConnection");

  remotePeerConnection.createAnswer(gotRemoteDescription,logError);

 } ;
function onLocalSessionCreated(desc) {
  console.log('local session created:', desc);
  localPeerConnection.setLocalDescription(desc, function() {
    console.log('sending local desc:', localPeerConnection.localDescription);
    sendMessage(localPeerConnection.localDescription);
  },logError);
 };
function gotLocalDescription(description){
  localPeerConnection.setLocalDescription(description);
  trace("Offer from localPeerConnection: \n" + description.sdp);
 };
function gotRemoteDescription(description){
  localPeerConnection.setRemoteDescription(description);
  trace("Answer from remotePeerConnection: \n" + description.sdp);
  remotePeerConnection.onaddstream = gotRemoteStream;
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
function gotLocalStream(event){
  localVideo.src = URL.createObjectURL(event.stream);
  trace("Local video stream added to communication channel");
 }; 
function gotRemoteStream(event){
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(remoteVideo, e.stream);
  trace('remotePeerConnection received remote stream');
 };
function gotLocalIceCandidate(event){
  if (event.candidate) {
    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate),
                                        function() { onAddIceCandidateSuccess('localPeerConnection') },
                                        function(err) { onAddIceCandidateError('localPeerConnection', err); });
    trace("Local ICE candidate: \n" + event.candidate.candidate);
    // sendMessage({
    //     type: 'candidate',
    //     label: event.candidate.sdpMLineIndex,
    //     id: event.candidate.sdpMid,
    //     candidate: event.candidate.candidate
    //   });
  }else {
    console.log('End of candidates.');
    }
 };
function gotRemoteIceCandidate(event){
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate),
                                        function() { onAddIceCandidateSuccess('remotePeerConnection') },
                                        function(err) { onAddIceCandidateError('remotePeerConnection', err); });
    trace("Remote ICE candidate: \n" + event.candidate.candidate);
    // sendMessage({
    //     type: 'candidate',
    //     label: event.candidate.sdpMLineIndex,
    //     id: event.candidate.sdpMid,
    //     candidate: event.candidate.candidate
    //   });
  }else {
    console.log('End of candidates.');
    }
 }; 
function onAddIceCandidateSuccess(pc) {
  trace(pc + ' addIceCandidate success');
 };
function onAddIceCandidateError(pc, error) {
  trace(pc + ' failed to add ICE Candidate: ' + error.toString());
 };
function onIceStateChange(pc, event) {
  if (pc) {
    trace(pc + ' ICE state: ' + pc.iceConnectionState);
  }
 };
function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
 };
function onCreateOfferSuccess(desc) {
  trace('Offer from localPeerConnection\n');
  trace('Offer from localPeerConnection\n' + desc.sdp);
  trace('localPeerConnection setLocalDescription start');
  localPeerConnection.setLocalDescription(desc, function() { onSetLocalSuccess('localPeerConnection'); });
  trace('remotePeerConnection setRemoteDescription start');
  remotePeerConnection.setRemoteDescription(desc, function() { onSetRemoteSuccess('remotePeerConnection'); });
  trace('remotePeerConnection createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2.createAnswer(onCreateAnswerSuccess,onCreateSessionDescriptionError,sdpConstraints);
 };  
function onCreateAnswerSuccess(desc) {
  trace('Answer from remotePeerConnection:\n');
  trace('Answer from remotePeerConnection:\n' + desc.sdp);
  trace('remotePeerConnection setLocalDescription start');
  remotePeerConnection.setLocalDescription(desc, function() { onSetLocalSuccess('remotePeerConnection'); });
  trace('localPeerConnection setRemoteDescription start');
  localPeerConnection.setRemoteDescription(desc, function() { onSetRemoteSuccess('localPeerConnection'); });
 };
function onSetLocalSuccess(pc) {
  trace(pc + ' setLocalDescription complete');
 };
function onSetRemoteSuccess(pc) {
  trace(pc + ' setRemoteDescription complete');
 };
function handleError(){};


/****************************************************************************
 * Aux functions, mostly UI-related
 ****************************************************************************/
function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
 };
function logError(err) {
  console.log(err.toString(), err);
 };

});