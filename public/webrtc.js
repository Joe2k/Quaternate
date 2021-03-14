const WS_PORT = 4000; //make sure this matches the port for the webscokets server

var localUuid;
var localDisplayName;
var localStream;
var serverConnection;
var peerConnections = {}; // key is uuid, values are peer connection object and user defined display name string
var dest;
var displayed = {};

var peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

function start() {
  localUuid = $("#userId")[0].value;
  dest = $("#roomId")[0].value;

  // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
  var urlParams = new URLSearchParams(window.location.search);
  localDisplayName = $("#userName")[0].value;
  document
    .getElementById("localVideoContainer")
    .appendChild(makeLabel(localDisplayName));

  // specify no audio for user media
  var constraints = {
    video: {
      width: { max: 1280 },
      height: { max: 720 },
      frameRate: { max: 30 },
    },
    audio: true,
  };

  function heartbeat() {
    clearTimeout(this.pingTimeout);

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
      this.terminate();
    }, 30000 + 1000);
  }

  // set up local video stream
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        localStream = stream;
        document.getElementById("localVideo").srcObject = stream;
      })
      .catch(errorHandler)

      // set up websocket and message all existing clients
      .then(() => {
        console.log("ws://" + window.location.hostname + ":" + WS_PORT);
        serverConnection = new WebSocket(
          "wss://" + "quaternate-wss.herokuapp.com"
        );
        serverConnection.onmessage = gotMessageFromServer;
        serverConnection.onopen = (event) => {
          serverConnection.send(
            JSON.stringify({
              displayName: localDisplayName,
              uuid: localUuid,
              dest: dest,
            })
          );
        };
        serverConnection.onping = () => heartbeat;
        serverConnection.onclose = function clear() {
          clearTimeout(this.pingTimeout);
        };
      })
      .catch(errorHandler);
  } else {
    alert("Your browser does not support getUserMedia API");
  }
}
function togglemic() {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0]
    .enabled;

  var background = document.getElementById("mic").style.backgroundColor;
  if (background == "rgb(0, 0, 0)" || background == "") {
    document.getElementById("mic").style.background = "rgb(255, 30, 86)";
  } else {
    document.getElementById("mic").style.background = "rgb(0,0,0)";
  }
}

function togglevideo() {
  var constraints = {
    video: {
      width: { max: 320 },
      height: { max: 240 },
      frameRate: { max: 30 },
    },
    audio: true,
  };
  //   console.log(localStream.getVideoTracks());
  //   if (localStream.getVideoTracks()[0].readyState !== "ended") {
  //     localStream.getVideoTracks()[0].stop();
  //   } else {
  //     navigator.mediaDevices
  //       .getUserMedia(constraints)
  //       .then((stream) => {
  //         localStream = stream;
  //         document.getElementById("localVideo").srcObject = stream;
  //       })
  //       .catch(errorHandler);
  //   }
  localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0]
    .enabled;

  var background = document.getElementById("video").style.backgroundColor;
  console.log(background);
  if (background == "rgb(0, 0, 0)" || background == "") {
    document.getElementById("video").style.background = "rgb(255, 30, 86)";
  } else {
    document.getElementById("video").style.background = "rgb(0,0,0)";
  }
}

function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);
  var peerUuid = signal.uuid;

  // Ignore messages that are not for us or from ourselves
  if (
    peerUuid == localUuid ||
    (signal.dest != localUuid && signal.dest != dest)
  )
    return;

  if (signal.displayName && signal.dest == dest) {
    // set up peer connection object for a newcomer peer
    setUpPeer(peerUuid, signal.displayName);
    serverConnection.send(
      JSON.stringify({
        displayName: localDisplayName,
        uuid: localUuid,
        dest: peerUuid,
      })
    );
  } else if (signal.displayName && signal.dest == localUuid) {
    // initiate call if we are the newcomer peer
    setUpPeer(peerUuid, signal.displayName, true);
  } else if (signal.sdp) {
    peerConnections[peerUuid].pc
      .setRemoteDescription(new RTCSessionDescription(signal.sdp))
      .then(function () {
        // Only create answers in response to offers
        if (signal.sdp.type == "offer") {
          peerConnections[peerUuid].pc
            .createAnswer()
            .then((description) => createdDescription(description, peerUuid))
            .catch(errorHandler);
        }
      })
      .catch(errorHandler);
  } else if (signal.ice) {
    peerConnections[peerUuid].pc
      .addIceCandidate(new RTCIceCandidate(signal.ice))
      .catch(errorHandler);
  }
}

function setUpPeer(peerUuid, displayName, initCall = false) {
  console.log("yee ocnnected");
  peerConnections[peerUuid] = {
    displayName: displayName,
    pc: new RTCPeerConnection(peerConnectionConfig),
  };
  peerConnections[peerUuid].pc.onicecandidate = (event) =>
    gotIceCandidate(event, peerUuid);
  peerConnections[peerUuid].pc.ontrack = (event) =>
    gotRemoteStream(event, peerUuid);
  peerConnections[peerUuid].pc.oniceconnectionstatechange = (event) =>
    checkPeerDisconnect(event, peerUuid);
  peerConnections[peerUuid].pc.addStream(localStream);

  if (initCall) {
    peerConnections[peerUuid].pc
      .createOffer()
      .then((description) => createdDescription(description, peerUuid))
      .catch(errorHandler);
  }
}

function gotIceCandidate(event, peerUuid) {
  if (event.candidate != null) {
    serverConnection.send(
      JSON.stringify({ ice: event.candidate, uuid: localUuid, dest: peerUuid })
    );
  }
}

function createdDescription(description, peerUuid) {
  console.log(`got description, peer ${peerUuid}`);
  peerConnections[peerUuid].pc
    .setLocalDescription(description)
    .then(function () {
      serverConnection.send(
        JSON.stringify({
          sdp: peerConnections[peerUuid].pc.localDescription,
          uuid: localUuid,
          dest: peerUuid,
        })
      );
    })
    .catch(errorHandler);
}

function gotRemoteStream(event, peerUuid) {
  console.log(`got remote stream, peer ${peerUuid}`);
  //assign stream to new HTML video element
  if (displayed[peerUuid] != true) {
    var vidElement = document.createElement("video");
    vidElement.setAttribute("autoplay", "");
    vidElement.setAttribute("muted", "");
    vidElement.srcObject = event.streams[0];

    var vidContainer = document.createElement("div");
    vidContainer.setAttribute("id", "remoteVideo_" + peerUuid);
    vidContainer.setAttribute("class", "col-6 videoContainer");
    vidContainer.appendChild(vidElement);
    vidContainer.appendChild(makeLabel(peerConnections[peerUuid].displayName));

    document.getElementById("videos").appendChild(vidContainer);
    displayed[peerUuid] = true;
  }
}

function checkPeerDisconnect(event, peerUuid) {
  var state = peerConnections[peerUuid].pc.iceConnectionState;
  console.log(`connection with peer ${peerUuid} ${state}`);
  if (state === "failed" || state === "closed" || state === "disconnected") {
    delete peerConnections[peerUuid];
    document
      .getElementById("videos")
      .removeChild(document.getElementById("remoteVideo_" + peerUuid));
    displayed[peerUuid] = false;
  }
}

function startCall() {
  document.getElementById("startCall").style.display = "none";
  document.getElementById("videos").style.display = "flex";
  document.getElementById("footer1").style.display = "block";
  start();
}

function stopConnection() {
  for (var peerUuid in peerConnections) {
    peerConnections[peerUuid].pc.close();
    document
      .getElementById("videos")
      .removeChild(document.getElementById("remoteVideo_" + peerUuid));
    displayed[peerUuid] = false;
  }
  peerConnections = {};
  document.getElementById("startCall").style.display = "block";
  document.getElementById("videos").style.display = "none";
  document.getElementById("footer1").style.display = "none";
  localStream.getVideoTracks()[0].stop();
}

function openJam() {
  document.getElementById("drawing").style.display = "block";
  document.getElementById("openJamButton").style.display = "none";
  document.getElementById("closeJamButton").style.display = "inline";
  document.getElementById("deleteJam").style.display = "inline";
}
function closeJam() {
  document.getElementById("drawing").style.display = "none";
  document.getElementById("openJamButton").style.display = "inline";
  document.getElementById("closeJamButton").style.display = "none";
  document.getElementById("deleteJam").style.display = "none";
}

// function updateLayout() {
//   // update CSS grid based on number of diplayed videos
//   var rowHeight = "98vh";
//   var colWidth = "98vw";

//   var numVideos = Object.keys(peerConnections).length + 1; // add one to include local video

//   if (numVideos > 1 && numVideos <= 4) {
//     // 2x2 grid
//     rowHeight = "48vh";
//     colWidth = "48vw";
//   } else if (numVideos > 4) {
//     // 3x3 grid
//     rowHeight = "32vh";
//     colWidth = "32vw";
//   }

//   document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
//   document.documentElement.style.setProperty(`--colWidth`, colWidth);
// }

function makeLabel(label) {
  var vidLabel = document.createElement("div");
  vidLabel.appendChild(document.createTextNode(label));
  vidLabel.setAttribute("class", "videoLabel");
  return vidLabel;
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}
