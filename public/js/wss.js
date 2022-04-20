import * as store from './store.js'
import * as ui from './ui.js'

export const registerSocketEvents = (socket) => {
  socket.on('connect', () => {
    console.log('successfully conneted to server')
    store.setSocketId(socket.id)
    ui.updatePersonalCode(socket.id);
  })
}
