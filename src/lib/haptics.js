import * as Haptics from 'expo-haptics';

// Small vibrations for moments that matter (sending, pinning, deleting). Never throws: some phones have no motor
// or the user switched haptics off, and that must not break the action.
const safe = (fn) => {
  try {
    fn().catch(() => {});
  } catch {
    // ignore
  }
};

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  select: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
