let sharedAudioContext = null;
let unlockHandlersAttached = false;
let pendingAlertType = null;

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'click', 'mousemove', 'scroll', 'focus'];

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

const playGlassPop = (audioContext, startFreq = 880, endFreq = 1174.66, delay = 0, volume = 0.05) => {
  const startTime = audioContext.currentTime + delay;
  const duration = 0.08;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(startFreq, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.04);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.01);
};

const runAlertPattern = (audioContext, type = 'warning') => {
  try {
    if (type === 'lowStock' || type === 'dueSoon') {
      playGlassPop(audioContext, 783.99, 1046.50, 0, 0.05);
      playGlassPop(audioContext, 1046.50, 1318.51, 0.07, 0.05);
      return true;
    }

    if (type === 'outOfStock' || type === 'overdue') {
      playGlassPop(audioContext, 659.25, 880.00, 0, 0.05);
      playGlassPop(audioContext, 880.00, 1174.66, 0.06, 0.05);
      playGlassPop(audioContext, 1174.66, 1567.98, 0.12, 0.05);
      return true;
    }

    if (type === 'workflow') {
      playGlassPop(audioContext, 880.00, 1318.51, 0, 0.06);
      return true;
    }

    playGlassPop(audioContext, 880.00, 1174.66, 0, 0.05);
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

if (typeof window !== 'undefined') {
  initAlertSound();
}

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

    if (audioContext.state === 'running') {
      pendingAlertType = null;
      return runAlertPattern(audioContext, type);
    }

    pendingAlertType = type;
    return false;
  } catch (error) {
    console.error('Error playing alert sound:', error);
    return false;
  }
};
