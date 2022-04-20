// Always a root location to be used for connection
const socket = io('/');

socket.on('connect', () => {
  console.log('successfully conneted to server');
  console.log(socket.id);
});

