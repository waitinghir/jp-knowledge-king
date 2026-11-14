import { MaterialIcons } from '@expo/vector-icons';

/** Streak flame: orange when the player has practised today, grey when not yet. */
export default function FlameIcon({ lit, size = 40 }: { lit: boolean; size?: number }) {
  return <MaterialIcons name="local-fire-department" size={size} color={lit ? '#FF8A3D' : '#6C7A89'} />;
}
