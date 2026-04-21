let sharedAudioContext = null;
let unlockHandlersAttached = false;
let pendingAlertType = null;

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  return sharedAudioContext;
};

const detachUnlockListeners = () => {
  if (typeof window === 'undefined' || !unlockHandlersAttached) return;

  UNLOCK_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, handleUserUnlock);
  });

  unlockHandlersAttached = false;
};

const playBeep = (audioContext, frequency, duration, delay = 0) => {
  const startTime = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.28, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

const runAlertPattern = (audioContext, type = 'warning') => {
  try {
    if (type === 'lowStock') {
      playBeep(audioContext, 800, 0.28, 0);
      playBeep(audioContext, 800, 0.28, 0.38);
      return true;
    }

    if (type === 'outOfStock') {
      playBeep(audioContext, 1000, 0.32, 0);
      playBeep(audioContext, 1000, 0.32, 0.24);
      playBeep(audioContext, 1200, 0.38, 0.48);
      return true;
    }

    playBeep(audioContext, 900, 0.3, 0);
    return true;
  } catch (error) {
    console.error('Error creating alert sound:', error);
    return false;
  }
};

async function handleUserUnlock() {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (audioContext.state === 'running') {
      detachUnlockListeners();

      if (pendingAlertType) {
        const queuedType = pendingAlertType;
        pendingAlertType = null;
        runAlertPattern(audioContext, queuedType);
      }
    }
  } catch (error) {
    console.warn('Alert sound is still locked by the browser:', error);
  }
}

export const initAlertSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext || typeof window === 'undefined' || unlockHandlersAttached) return;

  UNLOCK_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, handleUserUnlock, { passive: true });
  });

  unlockHandlersAttached = true;
};

// Sound Alert Utility for inventory notifications
export const playAlertSound = async (type = 'warning') => {
  try {
    const audioContext = getAudioContext();
    if (!audioContext) {
      console.warn('AudioContext is not supported in this browser.');
      return false;
    }

    if (audioContext.state === 'suspended') {
      pendingAlertType = type;

      try {
        await audioContext.resume();
      } catch (error) {
        console.warn('Alert sound resume was blocked until user interaction.', error);
      }
    }

    if (audioContext.state !== 'running') {
      pendingAlertType = type;
      return false;
    }

    pendingAlertType = null;
    return runAlertPattern(audioContext, type);
  } catch (error) {
    console.error('Error playing alert sound:', error);
    return false;
  }
};
