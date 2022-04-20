import * as store from './store.js';
// Always a root location to be used for connection
const socket = io('/');

socket.on('connect', () => {
  console.log('successfully conneted to server');
  store.setSocketId(socket.id);
});

