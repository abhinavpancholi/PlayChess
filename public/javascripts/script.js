const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const statusElement = document.querySelector(".status");
const userCountElement = document.querySelector(".user-count");
const turnPopupElement = document.querySelector(".turn-popup");
const messageElement = document.querySelector(".message");
const usernameInput = document.querySelector("#username");
const roomNameInput = document.querySelector("#roomName");
const createRoomButton = document.querySelector("#createRoomButton");
const joinRoomButton = document.querySelector("#joinRoomButton");
const usersList = document.querySelector("#usersList");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector(".chat-messages");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let currentRoom = null;
let username = null;

createRoomButton.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  username = usernameInput.value.trim();
  if (roomName && username) {
    socket.emit("createRoom", { roomName, username });
    currentRoom = roomName;
  }
});

joinRoomButton.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  username = usernameInput.value.trim();
  if (roomName && username) {
    socket.emit("joinRoom", { roomName, username });
    currentRoom = roomName;
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) {
    socket.emit("sendMessage", { message, username, roomName: currentRoom });
    chatInput.value = "";
  }
});

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "\u2659",
    r: "\u2656",
    n: "\u2658",
    b: "\u2657",
    q: "\u2655",
    k: "\u2654",
  };
  return unicodePieces[piece.type];
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move, currentRoom);
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = true;

        pieceElement.addEventListener("dragstart", (e) => {
          if (
            (square.color === "w" &&
              playerRole === "w" &&
              chess.turn() === "w") ||
            (square.color === "b" && playerRole === "b" && chess.turn() === "b")
          ) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            showPossibleMoves(rowIndex, squareIndex);
          }
          e.dataTransfer.setData("text/plain", "");
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
          const squares = document.querySelectorAll(".square");
          squares.forEach((square) => square.classList.remove("possible-move"));
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (chess.in_checkmate()) {
    statusElement.textContent = "Checkmate";
  } else if (chess.in_check()) {
    statusElement.textContent = "Check";
  } else if (chess.in_draw()) {
    statusElement.textContent = "Draw";
  } else if (chess.in_stalemate()) {
    statusElement.textContent = "Stalemate";
  } else if (chess.in_threefold_repetition()) {
    statusElement.textContent = "Threefold Repetition";
  } else if (chess.insufficient_material()) {
    statusElement.textContent = "Insufficient Material";
  } else {
    statusElement.textContent = "";
  }

  turnPopupElement.textContent = `${
    chess.turn() === "w" ? "White's" : "Black's"
  } turn`;
  turnPopupElement.classList.add("visible");
  setTimeout(() => turnPopupElement.classList.remove("visible"), 2000);

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

socket.on("PlayerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectator", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("userCount", (count) => {
  userCountElement.textContent = `Online users: ${count}`;
});

socket.on("updateUsers", (users) => {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const userElement = document.createElement("li");
    userElement.textContent = `${user.username} (${user.role})`;
    usersList.appendChild(userElement);
  });
});

socket.on("error", (message) => {
  messageElement.textContent = message;
  setTimeout(() => (messageElement.textContent = ""), 3000);
});

socket.on("opponentJoined", () => {
  messageElement.textContent = "Opponent joined the room";
  setTimeout(() => (messageElement.textContent = ""), 3000);
});

socket.on("spectatorAvailable", () => {
  if (confirm("A pair is available. Do you want to join the game?")) {
    socket.emit("spectatorResponse", true, currentRoom);
  } else {
    socket.emit("spectatorResponse", false, currentRoom);
  }
});

socket.on("chatMessage", ({ message, username }) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

const showPossibleMoves = (row, col) => {
  const moves = chess.moves({
    square: `${String.fromCharCode(97 + col)}${8 - row}`,
    verbose: true,
  });
  const squares = document.querySelectorAll(".square");
  squares.forEach((square) => {
    square.classList.remove("possible-move");
  });
  moves.forEach((move) => {
    const targetSquare = document.querySelector(
      `.square[data-row="${8 - move.to[1]}"][data-col="${
        move.to.charCodeAt(0) - 97
      }"]`
    );
    targetSquare.classList.add("possible-move");
  });
};

renderBoard();
