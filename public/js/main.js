import * as store from './store.js';
import * as wss from './wss.js';
import * as webRTCHandler from './webRTCHandler.js';
import * as constants from './constants.js';
// Always a root location to be used for connection

// initialization of the socket io connection
const socket = io('/');
wss.registerSocketEvents(socket);

// registering event listener for personal code copy button
const personalCodeCopyButton = document.getElementById('personal_code_copy_button');
personalCodeCopyButton.addEventListener('click', () => {
  const personalCodeParagraph = document.getElementById('personal_code_paragraph');
  const personalCode = store.getState().socketId;
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

//register event listener for connection buttons
const personalCodeChatButton = document.getElementById('personal_code_chat_button');
const personalCodeVideoButton = document.getElementById('personal_code_video_button');

personalCodeChatButton.addEventListener('click', () => {
  console.log('chat button clicked');
  const calleePersonalCode = document.getElementById('personal_code_input').value;
  const callType = constants.callType.CHAT_PERSONAL_CODE;
  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
})
personalCodeVideoButton.addEventListener('click', () => {
  console.log('video button clicked')
  const calleePersonalCode = document.getElementById('personal_code_input').value;
  const callType = constants.callType.VIDEO_PERSONAL_CODE;
  webRTCHandler.sendPreOffer(callType, calleePersonalCode);
});




