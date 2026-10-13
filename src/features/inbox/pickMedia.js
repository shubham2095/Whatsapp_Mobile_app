import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// WhatsApp (and the backend) cap uploads at 16 MB.
export const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

export function mediaTypeFor(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' };

// Every picker resolves to one of: null (cancelled) | { error } | { file: { uri, name, mimeType, size, mediaType } }
function toFile({ uri, name, mimeType, size }, fallbackMime) {
  const type = mimeType || fallbackMime;
  if (size && size > MAX_UPLOAD_BYTES) return { error: 'That file is larger than 16 MB, which WhatsApp does not allow.' };
  const fileName = name || `file-${Date.now()}.${EXT[type] ?? 'bin'}`;
  return { file: { uri, name: fileName, mimeType: type, size: size ?? null, mediaType: mediaTypeFor(type) } };
}

function fromImagePicker(result, fallbackMime) {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return toFile({ uri: a.uri, name: a.fileName, mimeType: a.mimeType, size: a.fileSize }, a.type === 'video' ? 'video/mp4' : fallbackMime);
}

export async function takePhoto() {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { error: 'Allow camera access in Settings to take photos.' };
  return fromImagePicker(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 }), 'image/jpeg');
}

export async function pickFromGallery() {
  return fromImagePicker(
    await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 }),
    'image/jpeg',
  );
}

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return toFile({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size }, 'application/octet-stream');
}
