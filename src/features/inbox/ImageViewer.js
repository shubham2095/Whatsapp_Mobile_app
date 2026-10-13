import { Modal, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Full-screen image preview. `uri` null = closed.
export function ImageViewer({ uri, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {uri ? <Image source={{ uri }} contentFit="contain" style={{ flex: 1 }} /> : null}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close image"
          style={{ position: 'absolute', top: insets.top + 12, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}
