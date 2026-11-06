// Four-second, non-looping shot: rise from the sleeper, push into the portal,
// arc around the arriving plush, then settle into a readable title composition.
const shots = [
  { t: 0, position: [-3.8, 4.4, 20.5], target: [0, .5, 1], fov: 49 },
  { t: 1.25, position: [-1.8, 5.5, 17.8], target: [.6, 2, -2], fov: 46 },
  { t: 2.7, position: [2.5, 5.4, 14.2], target: [0, 2, .8], fov: 43 },
  { t: 4, position: [.7, 6.7, 16], target: [0, 2.8, -2], fov: 43 }
];
export function openingShot(seconds, { mobile = false, reduced = false } = {}) {
  const time = reduced ? 4 : Math.max(0, Math.min(4, seconds));
  let index = shots.findIndex((shot, i) => i < shots.length - 1 && time <= shots[i + 1].t);
  if (index < 0) index = shots.length - 2;
  const a = shots[index], b = shots[index + 1];
  const fraction = Math.max(0, Math.min(1, (time - a.t) / (b.t - a.t)));
  const blend = fraction * fraction * (3 - 2 * fraction);
  const mix = (x, y) => x + (y - x) * blend;
  const position = a.position.map((value, i) => mix(value, b.position[i]));
  if (mobile) { position[0] *= .6; position[2] += 9; }
  return { position, target: a.target.map((value, i) => mix(value, b.target[i])), fov: mix(a.fov, b.fov), progress: time / 4 };
}
