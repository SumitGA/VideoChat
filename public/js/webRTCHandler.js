import * as wss from './wss.js'
import * as constants from './constants.js'
import * as ui from './ui.js';
import * as store from './store.js'

let connectedUserDetails
let peerConnection;

const defaultConstraints = {
  audio: true,
  video: true,
}

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.1.google.com:13902',
    }
  ]
}

export const getLocalPreview = () => {
  navigator.mediaDevices.getUserMedia(defaultConstraints).then((stream) => {
    ui.updateLocalVideo(stream);
    store.setLocalStream(stream);
  }).catch((err) => {
    console.log(`error occured when trying to get an access to camera`);
  })
}

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onicecandidate = (event) => {
    if(event.candidate) {
      // send our ice candidate to other peer
    }
  }

  peerConnection.onconnectionstatechange = (event) => {
    if(peerConnection.connectionState == 'connected') {
      console.log('successfully connected to peer');
    }
  }
}

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  }

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    }
    ui.showCallingDialog(callingDialogRejectCallHandler)
    wss.sendPreOffer(data)
  }
}

const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedUserDetails.socketId,
    preOfferAnswer,
  }
  ui.removeAllDialogs()
  wss.sendPreOfferAnswer(data)
}

const acceptCallHandler = () => {
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED)
  ui.showCallElements(connectedUserDetails.callType)
}

const rejectCallHandler = () => {
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED)
}

export const handlePreOffer = (data) => {
  const { callType, callerSocketId } = data
  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  }
  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler)
  }
}

const callingDialogRejectCallHandler = () => {
  console.log('reject call handler')
}

export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data

  ui.removeAllDialogs()

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    ui.showInfoDialog(preOfferAnswer)
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    ui.showInfoDialog(preOfferAnswer)
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    ui.showInfoDialog(preOfferAnswer)
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    //TODO send webRTC offer
    ui.showCallElements(connectedUserDetails.callType)
  }
}
