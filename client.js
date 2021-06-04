const net = require('net'), port = 5000;
const client = net.createConnection({port: port}, () => {
  console.log('Connecting to Server...');
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    let data;
    while ((data = process.stdin.read()) !== null) {
      client.write(`${data}`);
    }
  });
  process.stdin.on('end', () => {
    client.end();
  });
}).on('data', data => {
  let message = data.toString();
  if(message === '/kill'){
    console.log('Goodbye');
    process.exit(1);
  } else {
    console.log(message);
  }
}).on('end', () => {
  console.log('Goodbye');
  process.exit(1);
});