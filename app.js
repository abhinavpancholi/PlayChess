const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socket(server);

const rooms = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("User connected");

  uniquesocket.on("createRoom", ({ roomName, username }) => {
    if (rooms[roomName]) {
      uniquesocket.emit("error", "Room already exists");
      return;
    }

    rooms[roomName] = {
      chess: new Chess(),
      players: {
        white: null,
        black: null,
      },
      spectators: [],
    };

    joinRoom(uniquesocket, roomName, username);
  });

  uniquesocket.on("joinRoom", ({ roomName, username }) => {
    if (!rooms[roomName]) {
      uniquesocket.emit("error", "Room does not exist");
      return;
    }

    joinRoom(uniquesocket, roomName, username);
  });

  uniquesocket.on("move", (move, roomName) => {
    try {
      const room = rooms[roomName];
      if (!room) return;

      const chess = room.chess;
      const playerRole = getPlayerRole(room, uniquesocket.id);

      if (chess.turn() === "w" && playerRole !== "white") return;
      if (chess.turn() === "b" && playerRole !== "black") return;

      const result = chess.move(move);

      if (result) {
        io.to(roomName).emit("move", move);
        io.to(roomName).emit("boardState", chess.fen());
      } else {
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      console.log("Invalid Move");
    }
  });

  uniquesocket.on("spectatorResponse", (play, roomName) => {
    try {
      if (!rooms[roomName]) return;

      if (play) {
        const room = rooms[roomName];
        if (!room.players.white) {
          room.players.white = {
            id: uniquesocket.id,
            username: uniquesocket.username,
          };
          uniquesocket.emit("PlayerRole", "w");
        } else if (!room.players.black) {
          room.players.black = {
            id: uniquesocket.id,
            username: uniquesocket.username,
          };
          uniquesocket.emit("PlayerRole", "b");
        }
        room.spectators = room.spectators.filter(
          (spectator) => spectator.id !== uniquesocket.id
        );
        io.to(roomName).emit("updateUsers", getUsersInRoom(roomName));
      }
    } catch (err) {
      console.log("Spectator Can't Move");
    }
  });

  uniquesocket.on("disconnect", () => {
    console.log("User disconnected");
    for (let roomName in rooms) {
      const room = rooms[roomName];
      let playerRole = getPlayerRole(room, uniquesocket.id);
      if (playerRole) {
        if (playerRole === "white") {
          room.players.white = null;
          if (room.players.black) {
            io.to(roomName).emit("opponentLeft", "black");
          }
        } else if (playerRole === "black") {
          room.players.black = null;
          if (room.players.white) {
            io.to(roomName).emit("opponentLeft", "white");
          }
        }
      } else {
        room.spectators = room.spectators.filter(
          (spectator) => spectator.id !== uniquesocket.id
        );
      }

      if (
        !room.players.white &&
        !room.players.black &&
        room.spectators.length === 0
      ) {
        delete rooms[roomName];
      } else {
        io.to(roomName).emit("updateUsers", getUsersInRoom(roomName));
      }
    }
  });

  uniquesocket.on("sendMessage", ({ message, username, roomName }) => {
    if (!rooms[roomName] || !username) return;
    const room = rooms[roomName];
    const role = getPlayerRole(room, uniquesocket.id) || "Spectator";
    io.to(roomName).emit("chatMessage", { message, username, role });
  });
});

const joinRoom = (uniquesocket, roomName, username) => {
  uniquesocket.join(roomName);
  const room = rooms[roomName];
  let role = null;

  if (!room.players.white) {
    room.players.white = { id: uniquesocket.id, username };
    role = "w";
  } else if (!room.players.black) {
    room.players.black = { id: uniquesocket.id, username };
    role = "b";
  } else {
    room.spectators.push({ id: uniquesocket.id, username });
    role = "spectator";
  }

  uniquesocket.emit("PlayerRole", role);
  uniquesocket.emit("boardState", room.chess.fen());
  io.to(roomName).emit("updateUsers", getUsersInRoom(roomName));
  io.to(roomName).emit(
    "userCount",
    Object.keys(room.players).filter((k) => room.players[k]).length +
      room.spectators.length
  );
};

const getPlayerRole = (rooms, socketId) => {
  if (rooms.players.white && rooms.players.white.id === socketId)
    return "white";
  if (rooms.players.black && rooms.players.black.id === socketId)
    return "black";
  return null;
};

const getUsersInRoom = (roomName) => {
  const room = rooms[roomName];
  if (!room) return [];

  const users = [];
  if (room.players.white)
    users.push({ username: room.players.white.username, role: "White" });
  if (room.players.black)
    users.push({ username: room.players.black.username, role: "Black" });
  room.spectators.forEach((spectator) =>
    users.push({ username: spectator.username, role: "Spectator" })
  );

  return users;
};

server.listen(PORT, () => {
  console.log("Server live at port 3000");
});
