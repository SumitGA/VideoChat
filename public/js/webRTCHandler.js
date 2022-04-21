import * as wss from './wss.js'
import * as constants from './constants.js'
import * as ui from './ui.js'
import * as store from './store.js'
import * as recordingUtils from './recordingUtils.js';

let connectedUserDetails
let peerConnection
let dataChannel

const defaultConstraints = {
  audio: true,
  video: true,
}

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.1.google.com:13902',
    },
  ],
}

export const getLocalPreview = () => {
  navigator.mediaDevices
    .getUserMedia(defaultConstraints)
    .then((stream) => {
      ui.updateLocalVideo(stream)
      ui.showVideoCallButtons();
      store.setCallState(constants.callState.CALL_AVAILABLE)
      store.setLocalStream(stream)
    })
    .catch((err) => {
      console.log(`error occured when trying to get an access to camera`)
    })
}

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration)
  dataChannel = peerConnection.createDataChannel('chat')

  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel
    dataChannel.onopen = () => {
      console.log('Peer connection is ready to receive data channel messages')
    }

    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data)
      ui.appendMessage(message)
    }
  }

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // send our ice candidate to other peer
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      })
    }
  }

  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === 'connected') {
      console.log('successfully connected to peer')
    }
  }

  //receiving remote stream
  const remoteStream = new MediaStream()
  store.setRemoteStream(remoteStream)
  ui.updateRemoteVideo(remoteStream)

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track)
  }

  // add our stream to peer connection
  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const localStream = store.getState().localStream
    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream)
    }
  }
}

export const sendMessageUsingDataChannel = (message) => {
  const stringifiedMessage = JSON.stringify(message)
  dataChannel.send(stringifiedMessage)
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
  createPeerConnection()
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
    createPeerConnection()
    sendWebRTCOffer()
  }
}

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  })
}

export const handleWebRTCOffer = async (data) => {
  console.log(data)
  await peerConnection.setRemoteDescription(data.offer)
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  })
}

export const handleWebRTCAnswer = async (data) => {
  console.log('handling webRTC answer')
  await peerConnection.setRemoteDescription(data.answer)
}

export const handleWebRTCCandidate = async (data) => {
  try {
    await peerConnection.addIceCandidate(data.candidate)
  } catch (err) {
    console.log(err)
  }
}

let screenSharingStream
export const switchBetweenCameraAndScreenSharing = async (
  screenSharingActive,
) => {
  if (screenSharingActive) {
    const localStream = store.getState().localStream
    const senders = peerConnection.getSenders()
    const sender = senders.find(
      (sender) =>
        sender.track.kind === screenSharingStream.getVideoTracks()[0].kind,
    )
    if (sender) {
      sender.replaceTrack(localStream.getVideoTracks()[0])
    }
    // Stop screen sharing stream
    store
      .getState()
      .screenSharingStream.getTracks()
      .forEach((track) => track.stop())

    store.setScreenSharingActive(!screenSharingActive)
    ui.updateLocalVideo(localStream)
  } else {
    console.log('switching for screen sharing')
    try {
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      store.setScreenSharingStream(screenSharingStream)

      // replace tracks which sender is sending
      const senders = peerConnection.getSenders()
      const sender = senders.find(
        (sender) =>
          sender.track.kind === screenSharingStream.getVideoTracks()[0].kind,
      )
      if (sender) {
        sender.replaceTrack(screenSharingStream.getVideoTracks()[0])
      }
      store.setScreenSharingActive(!screenSharingActive)
      ui.updateLocalVideo(screenSharingStream)
    } catch (err) {
      console.error('error occurred while switching to screen sharing', err)
    }
  }
}

// hangup
export const handleHangUp = () => {
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  }

  wss.sendUserHangedUp(data)
}

export const handleConnectedUserHangedUp = () => {
  closePeerConnectionAndResetState()
}

const closePeerConnectionAndResetState = () => {
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }

  // active mic and camera
  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE ||
    connectedUserDetails.callType === constants.callType.VIDEO_STRANGER
  ) {
    store.getState().localStream.getVideoTracks()[0].enabled = true
    store.getState().localStream.getAudioTracks()[0].enabled = true
  }
  ui.updateUiAfterHangUp(connectedUserDetails.callType)
  connectedUserDetails = null
}
