const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
const game = document.getElementById("unity-container");
OtherUsername = "";
chat.hidden = true;
myVideo.muted = true;
let peer;
window.onload = () => {
    $(document).ready(function() {
        $("#getCodeModal").modal("show");
    });
};

let myVideoStream;
const peers = {};
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;


// function sendmessage
sendmessage = (text) => {
    if (event.key === "Enter" && text.value != "") {
        socket.emit("messagesend", myname + ' : ' + text.value);
        text.value = "";
        main__chat_window.scrollTop = main__chat_window.scrollHeight;
    }
};

// Get camera & mic 
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream, myname);

        socket.on("user-connected", (id, username) => {
            console.log("userid:" + id);
            connectToNewUser(id, stream, username);
            socket.emit("tellName", myname);
        });

        socket.on("user-disconnected", (id) => {
            console.log(peers);
            if (peers[id]) peers[id].close();
        });
    });

// Get config from backend
socket.on('addConfig', handleAddPeer)

// Handle Peer
function handleAddPeer(res) {
  peer = new Peer(undefined, {
        config: {iceServers: [{urls: [res.stun]}, {username: res.uname, credential: res.pwd, urls: [res.turn]}]}
    });

    // Ketika peer menerima call
    peer.on("call", (call) => {
      getUserMedia({ video: true, audio: true },
          function(stream) {
              call.answer(stream); // Answer the call with an A/V stream.
              const video = document.createElement("video");
              call.on("stream", function(remoteStream) {
                  addVideoStream(video, remoteStream, OtherUsername);
              });
          },
          function(err) {
              console.log("Failed to get local stream", err);
          }
      );
  });

  // Peer on open first time, emit to BE 
  peer.on("open", (id) => {
      socket.emit("join-room", roomId, id, myname);
  })
}

// Ketika socket menerima pesan dari client lain
socket.on("createMessage", (message) => {
    var ul = document.getElementById("messageadd");
    var li = document.createElement("li");
    li.className = "message";
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
});

// Ketika socket menerima username client lain
socket.on("AddName", (username) => {
    OtherUsername = username;
    console.log(username);
});


// Hapus video orang yg sudah left
const RemoveUnusedDivs = () => {
    //
    alldivs = videoGrids.getElementsByTagName("div");
    for (var i = 0; i < alldivs.length; i++) {
        e = alldivs[i].getElementsByTagName("video").length;
        if (e == 0) {
            alldivs[i].remove();
        }
    }
};

// Func connect to new user
const connectToNewUser = (userId, streams, myname) => {
    const call = peer.call(userId, streams);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        //       console.log(userVideoStream);
        addVideoStream(video, userVideoStream, myname);
    });
    call.on("close", () => {
        video.remove();
        RemoveUnusedDivs();
    });
    peers[userId] = call;
};

const cancel = () => {
    $("#getCodeModal").modal("hide");
};


// TODO : change localhost:3030 with domain
const copy = async() => {
    const roomid = document.getElementById("roomid").innerText;
    await navigator.clipboard.writeText("https://prototype-io-oti.noth3r.repl.co/room/" + roomid);
};
const invitebox = () => {
    $("#getCodeModal").modal("show");
};

// TODO : fix BUG, mute tidak off di client lain
const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById("mic").style.color = "red";
    } else {
        document.getElementById("mic").style.color = "white";
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

// TODO : fix BUG, mute tidak off di client lain
const VideomuteUnmute = async () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled || enabled == undefined) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        myVideoStream.getVideoTracks()[0].muted = true;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
        myVideoStream.getVideoTracks()[0].muted = false;
    }
};

// Ketika klik chat
const showchat = () => {
    if (chat.hidden == false) {
        chat.hidden = true;
    } else {
        chat.hidden = false;
    }
};

const showgame = () => {
  if (game.style.display === "none") {
    game.style.display = "block";
  } else {
    game.style.display = "none";
  }
}

// Menambah <video> ke browser
const addVideoStream = (videoEl, stream, name) => {
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    const h1 = document.createElement("h1");
    const h1name = document.createTextNode(name);
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.classList.add(name)
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);
    videoGrid.append(videoEl);
    RemoveUnusedDivs();
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
}

// var buildUrl = "/Build";
//       var loaderUrl = buildUrl + "/testAlpha.loader.js";
//       var config = {
//         dataUrl: buildUrl + "/testAlpha.data",
//         frameworkUrl: buildUrl + "/testAlpha.framework.js",
//         codeUrl: buildUrl + "/testAlpha.wasm",
//         streamingAssetsUrl: "StreamingAssets",
//         companyName: "DefaultCompany",
//         productName: "projectAlpha",
//         productVersion: "1.0",
//       };

//       var container = document.querySelector("#unity-container");
//       var canvas = document.querySelector("#unity-canvas");
//       var loadingBar = document.querySelector("#unity-loading-bar");
//       var progressBarFull = document.querySelector("#unity-progress-bar-full");
//       var fullscreenButton = document.querySelector("#unity-fullscreen-button");
//       var mobileWarning = document.querySelector("#unity-mobile-warning");

//       // By default Unity keeps WebGL canvas render target size matched with
//       // the DOM size of the canvas element (scaled by window.devicePixelRatio)
//       // Set this to false if you want to decouple this synchronization from
//       // happening inside the engine, and you would instead like to size up
//       // the canvas DOM size and WebGL render target sizes yourself.
//       // config.matchWebGLToCanvasSize = false;

//       if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
//         container.className = "unity-mobile";
//         // Avoid draining fillrate performance on mobile devices,
//         // and default/override low DPI mode on mobile browsers.
//         config.devicePixelRatio = 1;
//         mobileWarning.style.display = "block";
//         setTimeout(() => {
//           mobileWarning.style.display = "none";
//         }, 5000);
//       } else {
//         canvas.style.width = "960px";
//         canvas.style.height = "600px";
//       }
//       loadingBar.style.display = "block";

//       var script = document.createElement("script");
//       script.src = loaderUrl;
//       script.onload = () => {
//         createUnityInstance(canvas, config, (progress) => {
//           progressBarFull.style.width = 100 * progress + "%";
//         }).then((unityInstance) => {
//           loadingBar.style.display = "none";
//           fullscreenButton.onclick = () => {
//             unityInstance.SetFullscreen(1);
//           };
//         }).catch((message) => {
//           alert(message);
//         });
//       };
//       document.body.appendChild(script);