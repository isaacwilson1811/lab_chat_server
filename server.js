// import modules
const net = require('net'), port = 5000;
const fs = require('fs'), path = require('path');

// global variables
// stores a reference to each client connection object (socket)
const activeSockets = [];
// list of valid server commands
const serverCommands = ['/w', '/username', '/kick', '/clientlist'];

// create server and event listeners
const server = net.createServer( socket => {
  // when new a new client starts a socket connection
  socket.setEncoding('utf8');
  // generate a random guest user name and save a reference to this socket in activeSockets
  socket.userName = getRandomName();
  activeSockets.push(socket);
  // send a welcome message to this client and broadcast a message to all other active clients
  socket.write(`Welcome to the chat, ${socket.userName}`);
  broadcast(`${socket.userName} has joined the chat.`, socket);

  // when a client emits a data event
  socket.on('data', data => {
    // remove the newline character from data and name it 'input'
    let input = data.replace('\n', '');
    // check if the input starts with a server command
    if (isACommand(input, serverCommands)) {handleCommand(input, socket)}
    // if it's not a command, just brodcast the chat message
    else {broadcast(`${socket.userName} says: ${input}`, socket)}
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
function serverLog(message) {
  let time = new Date();
  let timeStamp = `${time.getFullYear()}-${(time.getMonth()+1)}-${time.getDate()} | ${time.getHours()} : ${time.getMinutes()} : ${time.getSeconds()}`;
  fs.appendFile(logFilePath, `[${timeStamp}]\n${message}\n\n`, 'utf8', err => { 
    if (err) { throw err };
    console.log('server.log appended with:');
    console.log(`[${timeStamp}]\n${message}\n`);
  });
}

// function to broadcast any message to all active sockets, excluding the sender or socket that emmited the event
function broadcast(message, excludedSocket) {
  serverLog(message);
  activeSockets.forEach( socket => {
    if (socket.remotePort !== excludedSocket.remotePort) {
      socket.write(message);
    }
  });
}

// function to handle removing a socket reference from the list of activeSockets, then emmiting the socket.end event.
// the client process will then exit
function endSocket(thisSocket) {
  serverLog(`Ending socket connection on remote port: ${thisSocket.remotePort} -- userName: ${thisSocket.userName}`);
  activeSockets.splice ( activeSockets.findIndex ( socket => socket.remotePort === thisSocket.remotePort ), 1 );
  thisSocket.end;
}

// function to create unique initial usernames
const claimedNames = [];
function getRandomName() {
  let name = `Guest${Math.floor(Math.random()*1000)}`;
  if (!claimedNames.includes(name)) {
    claimedNames.push(name);
    return name;
  }
  getRandomName();
}

// function that tests if input starts with a server command
function isACommand(string,array) {
  for (let i = 0; i < array.length; i++) {
    if (new RegExp('^'+array[i]).test(string)) {
      return true;
    }
  }
  return false;
}

// function to parse commands and return extracted args
function parseCommand(input,cmd) {
  // remove the command name and first space from input and call it 'textAfterCommand'
  let textAfterCmd = input.replace(cmd+' ', '');
  // extract the first argument by making the remaining text into an array seperated by spaces and getting the first element
  let arg1 = textAfterCmd.split(' ')[0];
  // get the second argument by removing the first argument from the 'textAfterCommand' string
  let arg2 = textAfterCmd.replace(`${arg1}`, '').trim();
  return [arg1,arg2];
}

// function to handle command input
const handleCommand = (input,socket) => {
  // check for the whisper command
  if (input === '/w'){
    // send an example of how to use the command
    socket.write('Whisper command expects a recipent\nexample: /w Guest666 hello, how are you?');
  }
  // check if input string starts with a command name folowed by a space
  else if ( /^\/w\s/.test(input) ){
    // destructure out the returned args from the command parsing function
    let [sendTo, privateMessage] = parseCommand(input,'/w');
    // server log that this command was received and parsed as such
    serverLog(`command /w [${sendTo}] [${privateMessage}] sent from ${socket.userName}`);
    if (sendTo === socket.userName) {
      socket.write('Whispering to yourself is not allowed')
      return
    }
    // look up the client with the 'userName' that matches 'sendTo'
    let foundSocket = false;
    for (let i = 0; i < activeSockets.length; i++) {
      // if they are found, send them the private message and stop looking
      if (activeSockets[i].userName === sendTo) {
        activeSockets[i].write(`${socket.userName} whispers to you: ${privateMessage} `);
        foundSocket = true;
        break;
      }
    }
    if (!foundSocket) {
      // if they are not found, send an error
      socket.write(`No client with the name of [${sendTo}] could be found`);
    }
  }
  else if ( /^\/username\s/.test(input) ) {
    let arg = input.replace('/username ', '').trim();
    console.log(`command /username [${arg}] sent from ${socket.userName}`);
  }
  else if ( /^\/kick\s/.test(input) ) {
    let arg = input.replace('/kick ', '').trim();
    console.log(`command /kick [${arg}] sent from ${socket.userName}`);
  }
  else if ( input === '/clientlist') {
    serverLog(`/clientlist command sent from ${socket.userName}`);
  }
}
