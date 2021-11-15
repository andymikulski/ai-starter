import Phaser from "phaser";
import Blackboard from "../base/Blackboard";

export const getClosestLightSource = (
  blackboard: Blackboard,
  position: { x: number; y: number },
  maxDistance: number
): null | Phaser.GameObjects.Components.Transform => {
  const lights = blackboard.getTagged(
    "emitter:light"
  ) as Phaser.GameObjects.Components.Transform[];
  if (!lights.length) {
    return null;
  }

  let dist;
  let closestDist = Infinity;
  let nearestLight = null;
  for (let i = 0; i < lights.length; i++) {
    dist = Phaser.Math.Distance.BetweenPoints(lights[i], position);

    if (dist > closestDist || dist > maxDistance) {
      continue;
    }
    if (dist < closestDist) {
      closestDist = dist;
      nearestLight = lights[i];
    }
  }

  return nearestLight;
};
