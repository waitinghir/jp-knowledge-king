import { Audio } from 'expo-av';

// Preload all sounds at app start for zero-latency playback
const SOUNDS = {
  tap:       require('../assets/sounds/tap.wav'),
  correct:   require('../assets/sounds/correct.wav'),
  incorrect: require('../assets/sounds/incorrect.wav'),
  timeout:   require('../assets/sounds/timeout.wav'),
  win:       require('../assets/sounds/win.wav'),
  lose:      require('../assets/sounds/lose.wav'),
} as const;

type SoundKey = keyof typeof SOUNDS;

// Cache of loaded Sound objects
const cache: Partial<Record<SoundKey, Audio.Sound>> = {};

let initialized = false;

export async function initSounds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    shouldDuckAndroid: true,
  });

  await Promise.all(
    (Object.keys(SOUNDS) as SoundKey[]).map(async (key) => {
      const { sound } = await Audio.Sound.createAsync(SOUNDS[key], { volume: 1.0 });
      cache[key] = sound;
    })
  );
}

export async function playSound(key: SoundKey): Promise<void> {
  try {
    const sound = cache[key];
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // 靜默失敗，音效不影響遊戲流程
  }
}

export async function unloadSounds(): Promise<void> {
  await Promise.all(
    Object.values(cache).map((s) => s?.unloadAsync())
  );
}
