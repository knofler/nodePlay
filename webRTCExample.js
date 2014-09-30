define(['services/logger', 'services/dataservice', 'services/messenger', 'knockout'], function (logger, dataservice, messenger, ko) {

    var
        webrtc = {
            init: init,
            call: call
        },
        _myMediaStream = null,
        _myConstraints = null,
        _myConnection = null,
        _iceServers = [{ url: 'stun:74.125.142.127:19302' }]; // stun.l.google.com - Firefox does not support DNS names.


    function init(constraints) {
        getUserMedia(constraints, function (stream) {

            var videoElement = document.querySelector('#myVideo');
            //videoElement.muted = true;
            videoElement.controls = true;
            _myMediaStream = stream;
            _myConstraints = constraints;

            attachMediaStream(videoElement, _myMediaStream);

            messenger.publish('LocalMediaStreamSet');

        }, function (error) {
            logger.logError(JSON.stringify(error), null, 'webrtc/init', true);
        });
    }

    function call(user) {
        _myConnection = _myConnection || _createConnection();

        _myConnection.addStream(_myMediaStream);

        _myConnection.createOffer(function (desc) {

            _myConnection.setLocalDescription(desc, function () {
                dataservice.sendRTCMessage(JSON.stringify({ sdp: desc, origin: '', target: user, constraints: _myConstraints, type:'offer' }));
            });
        });
    }

    function _createConnection() {
        console.log('creating RTCPeerConnection...');

        var connection = new RTCPeerConnection({ iceServers: _iceServers }); // null = no ICE servers

        connection.onicecandidate = function (event) {
            if (event.candidate) {
                dataservice.sendICECandidate(JSON.stringify({ "candidate": event.candidate }))
                .then(function () {
                    console.log('ice candidate sent to remote peer.')
                });
            }
        };

        connection.onaddstream = function (event) {

            var videoElement = document.querySelector('#theirsVideo');
            videoElement.controls = true;
            console.log('attaching remote stream...')
            attachMediaStream(videoElement, event.stream);
            console.log('attaching remote stream done.')
        };

        connection.onremovestream = function () {
            console.log('Remote stream removed.');
        };

        return connection;
    }

    function _subscribeToEvents() {
        //subscribe to new RTCMessage events
        messenger.subscribe(document, 'newRTCMessage', function (e, message) {
            var
                isConfirmed = true,
                connection = _myConnection || _createConnection();

            if (message.sdp.type === 'offer') {
                //need confirmation to accept the call
                isConfirmed = confirm("Incoming call from " + message.origin + ", accept?");
            }
            if (message.sdp && isConfirmed) {



                connection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                    if (connection.remoteDescription.type === 'offer') {

                        //subscrive to localstream when ready (is setted on the init call below)
                        messenger.subscribe(document, 'LocalMediaStreamSet', function (e) {
                            console.log('received offer, sending answer...');

                            connection.addStream(_myMediaStream);

                            connection.createAnswer(function (desc) {

                                connection.setLocalDescription(desc, function () {
                                    dataservice.sendRTCMessage(JSON.stringify({ sdp: connection.localDescription, origin: '', target: message.origin, callId: '', type: 'answer' }));
                                });
                            });
                        });

                        init(message.constraints);

                    } else if (connection.remoteDescription.type === 'answer') {
                        console.log('got an answer');
                    }
                });
            } else if (message.candidate) {
                console.log('adding ice candidate from remote peer...');
                connection.addIceCandidate(new RTCIceCandidate(message.candidate));
            }

            _myConnection = connection;
        });
    }

    _subscribeToEvents();

    return webrtc;

});
