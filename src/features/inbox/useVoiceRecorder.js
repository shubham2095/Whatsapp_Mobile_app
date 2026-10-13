import { useState } from 'react';
import { Platform } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';

// WhatsApp accepts audio/aac|mp4|mpeg|amr|ogg|opus. Android records AMR-NB (a plain
// audio/amr file the backend recognises); other platforms use the AAC/m4a preset.
const ANDROID_AMR = {
  extension: '.amr',
  sampleRate: 8000,
  numberOfChannels: 1,
  bitRate: 12200,
  android: { outputFormat: 'amrnb', audioEncoder: 'amr_nb' },
  ios: {},
};

const OPTIONS = Platform.OS === 'android' ? ANDROID_AMR : RecordingPresets.HIGH_QUALITY;
const FILE = Platform.OS === 'android' ? { ext: 'amr', mimeType: 'audio/amr' } : { ext: 'm4a', mimeType: 'audio/mp4' };

// start() -> { error? }; stop() -> { file } | { error }; cancel() discards the take.
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 250);
  const [active, setActive] = useState(false);

  async function start() {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return { error: 'Allow microphone access in Settings to record voice notes.' };
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setActive(true);
      return {};
    } catch {
      return { error: 'Could not start recording.' };
    }
  }

  async function finish() {
    setActive(false);
    try {
      await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  }

  async function stop() {
    const seconds = (state.durationMillis ?? 0) / 1000;
    try {
      await finish();
    } catch {
      return { error: 'Could not save the recording.' };
    }
    if (!recorder.uri) return { error: 'Could not save the recording.' };
    if (seconds < 1) return { error: 'Recording too short. Hold on a little longer.' };
    return {
      file: { uri: recorder.uri, name: `voice-${Date.now()}.${FILE.ext}`, mimeType: FILE.mimeType, size: null, mediaType: 'audio', seconds },
    };
  }

  async function cancel() {
    try {
      await finish();
    } catch {}
  }

  return { recording: active, seconds: (state.durationMillis ?? 0) / 1000, start, stop, cancel };
}
