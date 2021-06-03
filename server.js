// import modules
const net = require('net'), port = 5000;
const fs = require('fs'), path = require('path');

// variable to store a reference to each client connection
const activeSockets = [];

// server events
const server = net.createServer( socket => {
  // when new client starts a connection, generate a user name and save a reference to this socket in activeSockets
  socket.setEncoding('utf8');
  socket.userName = `guest${Math.floor(Math.random()*100)}`;
  activeSockets.push(socket);

  // send a welcome message to this client and broadcast a message to all other active clients
  socket.write(`Welcome to the chat, ${socket.userName}!`);
  broadcast(`${socket.userName} has joined the chat.`, socket);

  // when server gets a message from a client, broadcast to all other active clients
  socket.on('data', data => {
    let message = `${socket.userName}: ${data.trim()}`;
    broadcast(message, socket);
  });

  // when a client ends the connection, brodcast that they have left. Then remove them from activeSockets and close this socket.
  socket.on('end', () => {
    broadcast(`${socket.userName} has left the chat.`, socket);
    endSocket(socket);
  })
});

// start the server event listener
server.listen(port, () => {
  serverLog(`Chat Server Started\nlistening on port ${port}`);
});

// ------------------- server functions ----------------------------------

// handles writing to the 'server.log' file. Generates timestamps, appends chat messages and server events to the log.
const logFilePath = path.join(__dirname, 'server.log');
const serverLog = message => {
  let time = new Date();
  let timeStamp = time.getFullYear() + "-" + (time.getMonth()+1) + "-" + time.getDate() + " " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
  fs.appendFile(logFilePath, `[${timeStamp}]\n${message}\n\n`, 'utf8', err => { 
    if (err) { throw err };
    console.log('server.log appended with:');
    console.log(`[${timeStamp}]\n${message}\n`);
  });
}

// function to broadcast any message to all active sockets, excluding the sender or socket that emmited the event
const broadcast = (message, excludedSocket) => {
  serverLog(message);
  activeSockets.forEach( socket => {
    if (socket.remotePort != excludedSocket.remotePort) {
      socket.write(message);
    }
  });
}

// function to handle removing a socket reference from the list of activeSockets, then emmiting the socket.end event.
// the client process will then exit
const endSocket = thisSocket => {
  serverLog(`Ending socket connection on remote port: ${thisSocket.remotePort} -- userName: ${thisSocket.userName}`);
  activeSockets.splice ( activeSockets.findIndex ( socket => socket.remotePort == thisSocket.remotePort ), 1 );
  thisSocket.end;
}

