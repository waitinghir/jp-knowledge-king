import Svg, { Path } from 'react-native-svg';

const OUTER =
  'M12 2C12.8 5.2 16.5 7.4 17.6 11C18.9 15.3 16.2 21 12 21C7.8 21 5.1 17.4 6.2 13.3' +
  'C6.8 11 8.4 9.7 9.2 8.2C9.6 10 10.4 11 11.4 11.4C10.8 8.4 11.2 4.6 12 2Z';
const INNER =
  'M12 12.5C13.6 14 14.6 15.4 14.4 17.2C14.2 18.8 13.2 19.6 12 19.6' +
  'C10.7 19.6 9.7 18.6 9.7 17.2C9.7 15.6 11 14.4 12 12.5Z';

/** Streak flame: filled when the player has practised today, an outline when not yet. */
export default function FlameIcon({ lit, size = 36 }: { lit: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {lit ? (
        <>
          <Path d={OUTER} fill="#FF8A3D" />
          <Path d={INNER} fill="#FFD23F" />
        </>
      ) : (
        <Path d={OUTER} fill="none" stroke="#6C7A89" strokeWidth={1.5} strokeLinejoin="round" />
      )}
    </Svg>
  );
}
