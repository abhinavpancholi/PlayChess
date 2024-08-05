# Chess Game

Welcome to the **Chess Game** project! This real-time multiplayer chess game allows two players to compete against each other while other users can join as spectators. The project leverages a range of modern web technologies to provide a seamless and interactive experience.

![2024-07-10](https://github.com/Kshiti-24/Chess-Game-using-Socket-io/assets/101202139/aee798e6-c591-4894-ba1b-16b0ecdc02d5)

## Features

- **Real-time Gameplay**: Players can compete in real-time thanks to Socket.io.
- **Spectator Mode**: Users can join and watch ongoing games without participating.
- **Modern UI**: Utilizes TailwindCSS for a clean and responsive design.
- **Chess Mechanics**: Powered by Chess.js to handle game rules and move validation.
- **Server-side Logic**: Built with Node.js and Express to manage game states and player interactions.
- **Dynamic Templating**: EJS is used for rendering dynamic content on the front-end.

## Technologies Used

- **Socket.io**: Enables real-time, bidirectional communication between the server and clients.
- **Express**: A fast, unopinionated, minimalist web framework for Node.js.
- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **EJS**: Embedded JavaScript templating.
- **Chess.js**: A JavaScript library for chess move generation, validation, and other utility functions.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development.

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/chess-game-using-socket-io.git
    cd chess-game-using-socket-io
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the server:
    ```bash
    npm start
    ```

4. Open your browser and navigate to:
    ```
    http://localhost:3000
    ```

## Usage

- **Playing the Game**: Two players can start a game by navigating to the game URL. Players can make moves in real-time, and the game state will update for both players.
- **Spectating**: Additional users can join the game URL to watch the ongoing game without interfering.
