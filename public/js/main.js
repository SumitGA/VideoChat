import * as store from './store.js';
import * as wss from './wss.js';
// Always a root location to be used for connection

// initialization of the socket io connection
const socket = io('/');
wss.registerSocketEvents(socket);

// registering event for personal code copy button
const personalCodeCopyButton = document.getElementById('personal_code_copy_button');
personalCodeCopyButton.addEventListener('click', () => {
  const personalCodeParagraph = document.getElementById('personal_code_paragraph');
  const personalCode = store.getState().socketId;
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});




