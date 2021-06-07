# Chat App
## Server / Client connection with sockets
### features logging to file and server commands
## uses net and fs node modules

### Start the Server, run a terminal instance
`node server`

### Start multiple clients, run in multiple terminals
`node client`

## Server Commands
### Whisper: Send a private message to a user
`/w <username> <message>`

### Change Username: Change your user name
`/username <newname>`

### List all users: Prints out all connected users
`/clientlist`

### Kick: Logs off a user, if a password is entered (it's 'password')
`/kick <username> <password>`