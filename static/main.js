const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
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
    await navigator.clipboard.writeText("http://localhost:3030/join/" + roomid);
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
const VideomuteUnmute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    console.log(getUserMedia);
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").style.color = "red";
    } else {
        document.getElementById("video").style.color = "white";
        myVideoStream.getVideoTracks()[0].enabled = true;
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