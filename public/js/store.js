let state = {
  socketId: null,
  localStream: null,
  remoteStream: null,
  screenSharingStream: null,
  allowConnectionFromStrangers: false,
  screenSharingActive: false,
}

export const setSocketId = (socketId) => {
  state = {
    ...state,
    socketId,
  }
}

export const setLocalStream = (stream) => {
  state = {
    ...state,
    localStream: stream,
  }
}

export const setAllowConnectionFromStrangers = (allowConnectionFromStrangers) => {
  state = {
    ...state,
    allowConnectionFromStrangers,
  }
}

export const setScreenSharingActive = (screenSharingActive) => { 
  state = {
    ...state,
    screenSharingActive,
  }
}

export const setScreenSharingStream = (stream) => {
  state = {
    ...state,
    screenSharingStream: stream,
  }
} 

export const setRemoteStream = (stream) => {  
  state = {
    ...state,
    remoteStream: stream,
  }
} 

export const getState = () => {
  return state;
} 