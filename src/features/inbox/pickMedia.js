import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
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

// Header files for a bulk send. WhatsApp templates accept only these formats: JPG or PNG for IMAGE, MP4 for VIDEO,
// PDF for DOCUMENT. `format` is the template's header format. Resolves like the other pickers above.
const HEADER_RULES = {
  IMAGE: { mimes: ['image/jpeg', 'image/png'], hint: 'JPG or PNG' },
  VIDEO: { mimes: ['video/mp4'], hint: 'MP4' },
  DOCUMENT: { mimes: ['application/pdf'], hint: 'PDF' },
};

// `maxBytes` lowers the size limit for callers that need less than the usual 16 MB (template samples: 5 MB).
export async function pickHeaderFile(format, { maxBytes } = {}) {
  const rule = HEADER_RULES[format];
  const picked =
    format === 'DOCUMENT'
      ? await pickDocument()
      : fromImagePicker(
          await ImagePicker.launchImageLibraryAsync({ mediaTypes: [format === 'VIDEO' ? 'videos' : 'images'], quality: 0.85 }),
          format === 'VIDEO' ? 'video/mp4' : 'image/jpeg',
        );
  if (!picked || picked.error) return picked;
  if (!rule.mimes.includes(picked.file.mimeType)) return { error: `This header must be a ${rule.hint} file.` };
  if (maxBytes && picked.file.size && picked.file.size > maxBytes) {
    return { error: `That file is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.` };
  }
  return picked;
}

// A square profile photo as a data URL, which is what the server stores. The photo is cropped to a square, shrunk to
// 256 px and saved as a JPEG, so it is only a few KB: the server sends it back with every sign-in and profile call,
// and the phone keeps a copy of it, so a big photo would slow the whole app down. source: 'gallery' | 'camera'.
const AVATAR_PIXELS = 256;

export async function pickAvatar(source = 'gallery') {
  const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
  let result;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: 'Allow camera access in Settings to take a photo.' };
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets?.length) return null;

  try {
    const small = await (await ImageManipulator.manipulate(result.assets[0].uri).resize({ width: AVATAR_PIXELS }).renderAsync()).saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.75,
      base64: true,
    });
    if (!small.base64) return { error: 'Could not read that photo. Try another one.' };
    return { dataUrl: `data:image/jpeg;base64,${small.base64}` };
  } catch {
    return { error: 'Could not read that photo. Try another one.' };
  }
}
