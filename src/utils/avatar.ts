import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';


const WEB_AVATAR_SIZE = 256;

export async function pickAvatar(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('media-library-permission-denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
   
    base64: Platform.OS === 'web',
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  if (Platform.OS === 'web' && asset.base64) {
    const dataUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    return downscaleDataUrl(dataUrl, WEB_AVATAR_SIZE);
  }

  return asset.uri;
}


function downscaleDataUrl(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas-context-unavailable');
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
