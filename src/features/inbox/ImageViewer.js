import { useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_SCALE = 5;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SCALE = 2.5;

const distance = (touches) => Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Pinch with two fingers to zoom, drag to move a zoomed image, double-tap to zoom in and out.
function ZoomableImage({ uri }) {
  const [scale] = useState(() => new Animated.Value(1));
  const [translate] = useState(() => new Animated.ValueXY());
  // Gesture state changes on every touch event and must not re-render the screen, so it is a plain mutable object.
  const [g] = useState(() => ({ scale: 1, x: 0, y: 0, start: null, lastCount: 0, lastTap: 0 }));

  const [responder] = useState(() => {
    const apply = (s, x, y) => {
      g.scale = s;
      g.x = x;
      g.y = y;
      scale.setValue(s);
      translate.setValue({ x, y });
    };

    const reset = () => {
      g.scale = 1;
      g.x = 0;
      g.y = 0;
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(translate, { toValue: { x: 0, y: 0 }, duration: 160, useNativeDriver: true }),
      ]).start();
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
          g.start = { scale: g.scale, x: g.x, y: g.y, dist: null };
        g.lastCount = 0;
      },
      onPanResponderMove: (e, gesture) => {
          const touches = e.nativeEvent.touches;
        // Lifting or adding a finger changes what the gesture means; re-base so the image does not jump.
        if (touches.length !== g.lastCount) {
          g.lastCount = touches.length;
          g.start = { scale: g.scale, x: g.x - gesture.dx, y: g.y - gesture.dy, dist: touches.length === 2 ? distance(touches) : null };
        }
        if (touches.length === 2 && g.start.dist) {
          apply(clamp(g.start.scale * (distance(touches) / g.start.dist), 1, MAX_SCALE), g.x, g.y);
        } else if (touches.length === 1 && g.scale > 1) {
          apply(g.scale, g.start.x + gesture.dx, g.start.y + gesture.dy);
        }
      },
      onPanResponderRelease: (e, gesture) => {
          const tapped = Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8 && g.lastCount <= 1;
        if (tapped) {
          const now = Date.now();
          if (now - g.lastTap < DOUBLE_TAP_MS) {
            g.lastTap = 0;
            if (g.scale > 1.05) reset();
            else apply(DOUBLE_TAP_SCALE, 0, 0);
            return;
          }
          g.lastTap = now;
        }
        if (g.scale <= 1.05) reset();
      },
    });
  });

  return (
    <View style={{ flex: 1 }} {...responder.panHandlers}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: translate.x }, { translateY: translate.y }, { scale }] }}>
        <Image source={{ uri }} contentFit="contain" style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

// Full-screen image preview with pinch zoom. `uri` null = closed (which also resets the zoom).
export function ImageViewer({ uri, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {uri ? <ZoomableImage key={uri} uri={uri} /> : null}
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
