'use strict';

angular.module('nodeAppApp')
  .controller('FileshareCtrl', function ($scope,socket) {
   

/****************************************************************************
 * Initial setup
 ****************************************************************************/

$scope.configuration = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
 };
// {'url':'stun:stun.services.mozilla.com'}

$scope.roomURL        = document.getElementById('url');
$scope.video          = document.querySelector('video');
$scope.photo          = document.getElementById('photo');
$scope.photoContext   = $scope.photo.getContext('2d');
$scope.trail          = document.getElementById('trail');
$scope.snapBtn        = document.getElementById('snap');
$scope.sendBtn        = document.getElementById('send');
$scope.snapAndSendBtn = document.getElementById('snapAndSend');

// Default values for width and height of the photoContext.
// Maybe redefined later based on user's webcam video stream.
$scope.photoContextW = 300,
$scope.photoContextH = 150;

// Attach even handlers
$scope.video.addEventListener('play', $scope.setCanvasDimensions);
$scope.snapBtn.addEventListener('click', $scope.snapPhoto);
$scope.sendBtn.addEventListener('click', $scope.sendPhoto);
$scope.snapAndSendBtn.addEventListener('click', $scope.snapAndSend);

// Create a random room if not already present in the URL.
$scope.isInitiator;
$scope.room = window.location.hash.substring(1);
if (!$scope.room) {
  // $scope.room = window.location.hash = $scope.randomToken();
 };


/****************************************************************************
 * Signaling server
 ****************************************************************************/

socket.socket.on('ipaddr', function(ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
  $scope.updateRoomURL(ipaddr);
 });
socket.socket.on('created', function(room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId);
  $scope.isInitiator = true;
  $scope.grabWebCamVideo();
 });
socket.socket.on('joined', function(room, clientId) {
  console.log('This peer has joined room', room, 'with client ID', clientId);
  $scope.isInitiator = false;
  $scope.grabWebCamVideo();
 });
socket.socket.on('full', function(room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
 });
socket.socket.on('ready', function() {
  $scope.createPeerConnection(isInitiator, configuration);
 });
socket.socket.on('log', function(array) {
  console.log.apply(console, array);
 });
socket.socket.on('message', function(message) {
  console.log('Client received message:', message);
  $scope.signalingMessageCallback(message);
 });

// Join a room
socket.socket.emit('create or join', $scope.room);

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

/**
 * Updates URL on the page so that users can copy&paste it to their peers.
 */
$scope.updateRoomURL = function(ipaddr) {
  var url;
  if (!ipaddr) {
    url = location.href;
  } else {
    url = location.protocol + '//' + ipaddr + ':2013/#' + room;
  }
  $scope.roomURL.innerHTML = url;
 };


/****************************************************************************
 * User media (webcam)
 ****************************************************************************/

$scope.grabWebCamVideo 			= function () {
  console.log('Getting user media (video) ...');
  getUserMedia({
    video: true
  }, $scope.getMediaSuccessCallback, $scope.getMediaErrorCallback);
 };
$scope.getMediaSuccessCallback 	= function (stream) {
  var streamURL = window.URL.createObjectURL(stream);
  console.log('getUserMedia video stream URL:', streamURL);
  window.stream = stream; // stream available to console
  $scope.ideo.src = streamURL;
  $scope.show(snapBtn);
 };
$scope.getMediaErrorCallback 	= function (error) {
  console.log('getUserMedia error:', error);
 };

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

$scope.peerConn;
$scope.dataChannel;

$scope.signalingMessageCallback   = function (message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    $scope.peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
      logError);
    $scope.peerConn.createAnswer(onLocalSessionCreated, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
      logError);

  } else if (message.type === 'candidate') {
    $scope.peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));

  } else if (message === 'bye') {
    // TODO: cleanup RTC connection?
  }
  };
$scope.createPeerConnection       = function (isInitiator, config) {
  console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
    config);
  $scope.peerConn = new RTCPeerConnection(config);

  // send any ice candidates to the other peer
  $scope.peerConn.onicecandidate = function(event) {
    console.log('onIceCandidate event:', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
   };
  if (isInitiator) {
    console.log('Creating Data Channel');
    $scope.dataChannel = $scope.peerConn.createDataChannel('photos');
    $scope.onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    $scope.peerConn.createOffer($scope.onLocalSessionCreated, logError);
   } else {
    $scope.peerConn.ondatachannel = function(event) {
      console.log('ondatachannel:', event.channel);
      $scope.dataChannel = event.channel;
      $scope.onDataChannelCreated($scope.dataChannel);
    };
   }
 };
$scope.onLocalSessionCreated      = function (desc) {
  console.log('local session created:', desc);
  $scope.peerConn.setLocalDescription(desc, function() {
    console.log('sending local desc:', $scope.peerConn.localDescription);
    $scope.sendMessage(peerConn.localDescription);
  }, logError);
 };
$scope.onDataChannelCreated       = function (channel) {
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
  };

  channel.onmessage = (webrtcDetectedBrowser === 'firefox') ?
    receiveDataFirefoxFactory() :
    receiveDataChromeFactory();
 };
$scope.receiveDataChromeFactory   = function () {
  var buf, count;
  return function onmessage(event) {
    if (typeof event.data === 'string') {
      buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
      count = 0;
      console.log('Expecting a total of ' + buf.byteLength + ' bytes');
      return;
    }

    var data = new Uint8ClampedArray(event.data);
    buf.set(data, count);

    count += data.byteLength;
    console.log('count: ' + count);

    if (count === buf.byteLength) {
      // we're done: all data chunks have been received
      console.log('Done. Rendering photo.');
      renderPhoto(buf);
    }
  };
 };
$scope.receiveDataFirefoxFactory  = function () {
  var count, total, parts;

  return function onmessage(event) {
    if (typeof event.data === 'string') {
      total = parseInt(event.data);
      parts = [];
      count = 0;
      console.log('Expecting a total of ' + total + ' bytes');
      return;
    }

    parts.push(event.data);
    count += event.data.size;
    console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) +
      ' to go.');

    if (count === total) {
      console.log('Assembling payload');
      var buf = new Uint8ClampedArray(total);
      var compose = function(i, pos) {
        var reader = new FileReader();
        reader.onload = function() {
          buf.set(new Uint8ClampedArray(this.result), pos);
          if (i + 1 === parts.length) {
            console.log('Done. Rendering photo.');
            renderPhoto(buf);
          } else {
            compose(i + 1, pos + this.result.byteLength);
          }
        };
        reader.readAsArrayBuffer(parts[i]);
      };
      compose(0, 0);
    }
  };
 };


/****************************************************************************
 * Aux functions, mostly UI-related
 ****************************************************************************/

$scope.snapPhoto 			= function () {
  photoContext.drawImage(video, 0, 0, photoContextW, photoContextH);
  show(photo, sendBtn);
 };
$scope.sendPhoto 			= function () {
  // Split data channel message in chunks of this byte length.
  var CHUNK_LEN = 64000;

  var img = photoContext.getImageData(0, 0, photoContextW, photoContextH),
    len = img.data.byteLength,
    n = len / CHUNK_LEN | 0;

  console.log('Sending a total of ' + len + ' byte(s)');
  dataChannel.send(len);

  // split the photo and send in chunks of about 64KB
  for (var i = 0; i < n; i++) {
    var start = i * CHUNK_LEN,
      end = (i + 1) * CHUNK_LEN;
    console.log(start + ' - ' + (end - 1));
    dataChannel.send(img.data.subarray(start, end));
  }

  // send the reminder, if any
  if (len % CHUNK_LEN) {
    console.log('last ' + len % CHUNK_LEN + ' byte(s)');
    dataChannel.send(img.data.subarray(n * CHUNK_LEN));
  }
 };
$scope.snapAndSend 			= function () {
  snapPhoto();
  sendPhoto();
 };
$scope.renderPhoto 			= function (data) {
  var canvas = document.createElement('canvas');
  canvas.classList.add('incomingPhoto');
  trail.insertBefore(canvas, trail.firstChild);

  var context = canvas.getContext('2d');
  var img = context.createImageData(photoContextW, photoContextH);
  img.data.set(data);
  context.putImageData(img, 0, 0);
 };
$scope.setCanvasDimensions 	= function () {
  if (video.videoWidth === 0) {
    setTimeout(setCanvasDimensions, 200);
    return;
  }

  console.log('video width:', video.videoWidth, 'height:', video.videoHeight);

  photoContextW = video.videoWidth / 2;
  photoContextH = video.videoHeight / 2;
  //photo.style.width = photoContextW + 'px';
  //photo.style.height = photoContextH + 'px';
  // TODO: figure out right dimensions
  photoContextW = 300; //300;
  photoContextH = 150; //150;
 };
$scope.show 				= function () {
  Array.prototype.forEach.call(arguments, function(elem) {
    elem.style.display = null;
  });
 };
$scope.hide 				= function () {
  Array.prototype.forEach.call(arguments, function(elem) {
    elem.style.display = 'none';
  });
 };
$scope.randomToken 			= function () {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
 };
$scope.logError 			= function (err) {
  console.log(err.toString(), err);
 };


});
