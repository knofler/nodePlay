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

var localStream, pc1, pc2;
var servers = null,
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
if (!room) {
  room = window.location.hash + randomToken();
 };

var offer= null;

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
  // $("#remoteVideo").css({"background-color":"red"});
 });
socket.socket.on('offerForAnswer',function(data){
  offer=data;
  // alert(data);
  });
socket.socket.on('streamVideo',function(data){
  gotRemoteStream(data);
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

function getName(pc) {
  return (pc == pc1) ? 'pc1' : 'pc2';
 };
function getOtherPc(pc) {
  return (pc == pc1) ? pc2 : pc1;
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
 function gotStream(stream) {
  trace('Received local stream');
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(localVideo, stream);gotStream
  localStream = stream;
  callButton.disabled = false;
 };
function getMediaErrorCallback(error) {
  console.log('getUserMedia error:', error);
 };
function start() {
  trace("Requesting local stream");
  startButton.disabled = true;
  getUserMedia({audio:true, video:true}, gotStream,getMediaErrorCallback);
 };
function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  trace('Starting call');
  // startTime = performance.now();
  var videoTracks = localStream.getVideoTracks();
  var audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0)
    trace('Using video device: ' + videoTracks[0].label);
  if (audioTracks.length > 0)
    trace('Using audio device: ' + audioTracks[0].label);
  var servers = null;
  pc1 = new RTCPeerConnection(servers);
  trace('Created local peer connection object pc1');
  pc1.onicecandidate = function(e) { onIceCandidate(pc1, e) };
  pc2 = new RTCPeerConnection(servers);
  trace('Created remote peer connection object pc2');
  pc2.onicecandidate = function(e) { onIceCandidate(pc2, e) };
  pc1.oniceconnectionstatechange = function(e) { onIceStateChange(pc1, e) };
  pc2.oniceconnectionstatechange = function(e) { onIceStateChange(pc2, e) };
  pc2.onaddstream = function(stream){
    socket.socket.emit('videoReady',{data:stream});
   };
  pc1.addStream(localStream);
  trace('Added local stream to pc1');

  trace('pc1 createOffer start');
  pc1.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError);
 }; 

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
 }; 

function onSetLocalSuccess(pc) {
  trace(getName(pc) + ' setLocalDescription complete');
 };
function onSetRemoteSuccess(pc) {
  trace(getName(pc) + ' setRemoteDescription complete');
 };

function gotRemoteStream(e) {
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(remoteVideo, e.stream);
  trace('pc2 received remote stream');
 };

function onCreateOfferSuccess(desc) {
  var offer = desc.sdp;
  trace('Offer from pc1\n');
  trace('Offer from pc1\n' + desc.sdp);
  trace('pc1 setLocalDescription start');
  pc1.setLocalDescription(desc, function() { onSetLocalSuccess('pc1'); });
  trace('pc2 setRemoteDescription start');
  pc2.setRemoteDescription(desc, function() { onSetRemoteSuccess('pc2'); });
  trace('pc2 createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  // socket.socket.emit('offerSend',offer);
  pc2.createAnswer(onCreateAnswerSuccess,onCreateSessionDescriptionError,sdpConstraints);
 };  
function onCreateAnswerSuccess(desc) {
  trace('Answer from pc2:\n');
  trace('Answer from pc2:\n' + desc.sdp);
  trace('pc2 setLocalDescription start');
  pc2.setLocalDescription(desc, function() { onSetLocalSuccess(pc2); });
  trace('pc1 setRemoteDescription start');
  pc1.setRemoteDescription(desc, function() { onSetRemoteSuccess(pc1); });
 }; 

function onIceCandidate(pc, event) {
  if (event.candidate) {
    getOtherPc(pc).addIceCandidate(new RTCIceCandidate(event.candidate),
        function() { onAddIceCandidateSuccess(pc) },
        function(err) { onAddIceCandidateError(pc, err); });
    trace(getName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
  }
 } 
function onAddIceCandidateSuccess(pc) {
  trace(getName(pc) + ' addIceCandidate success');
 };
function onAddIceCandidateError(pc, error) {
  trace(getName(pc) + ' failed to add ICE Candidate: ' + error.toString());
 };
function onIceStateChange(pc, event) {
  if (pc) {
    trace(getName(pc) + ' ICE state: ' + pc.iceConnectionState);
  }
 }; 

function hangup() {
  trace('Ending call');
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
 }; 

function answer(){

  alert(offer);

 } ; 
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