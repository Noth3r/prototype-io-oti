require('dotenv').config()
const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const url = require("url");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});
const path = require("path");
const favicon = require('serve-favicon')

app.set("view engine", "ejs");
// app.use(favicon(path.join(__dirname, 'static','favicon.ico')))
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

// TODO : Ganti uuid4 dengan rand String. ex: uie-asde-sde
app.get("/join", (req, res) => {
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
            query: req.query,
        })
    );
});

app.get("/joinw", (req, res) => {
    console.log(req.query)
    res.redirect(
        url.format({
            pathname: `/join/${req.query.meeting_id}`,
            query: {name: req.query.name}
        })
    );
});

app.get("/room/:rooms", (req, res) => {
  res.render("input", {roomid: req.params.rooms})
})

app.get("/joinold", (req, res) => {
  res.redirect(
        url.format({
            pathname: '/join/' + req.query.meeting_id,
            query: {name: req.query.name},
        })
    );
});

app.get("/join/:rooms", (req, res) => {
    res.render("room", { roomid: req.params.rooms, Myname: req.query.name });
});

io.on("connection", (socket) => {
    socket.emit('addConfig', {
          stun: process.env.STUN,
          uname: process.env.TURN_USERNAME,
          pwd: process.env.TURN_CREDENTIAL,
          turn: process.env.TURN_SERVER
    })

    // Jika seseorang join room 
    socket.on("join-room", (roomId, id, myname) => {

        socket.join(roomId);

        // broadcast ke client jika ada user yang connect
        socket.to(roomId).broadcast.emit("user-connected", id, myname);

        // Jika ada msg dari client, broadcast ke client dengan
        // roomId yang sama
        socket.on("messagesend", (message) => {
            console.log(message);
            io.to(roomId).emit("createMessage", message);
        });

        // Menambahkan nama ke client lain
        socket.on("tellName", (myname) => {
            console.log(myname);
            socket.to(roomId).broadcast.emit("AddName", myname);
        });

        // Jika seseorang dc, broadcast ke client di roomId yg sama
        socket.on("disconnect", () => {
            socket.to(roomId).broadcast.emit("user-disconnected", id);
        });
    });
});

server.listen(process.env.PORT || 3030);