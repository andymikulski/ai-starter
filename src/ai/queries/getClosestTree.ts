import Phaser from 'phaser';
import Blackboard from '../base/Blackboard';


export const getClosestTree = (blackboard: Blackboard, position: { x: number; y: number; }, maxDistance: number): null | Phaser.GameObjects.Components.Transform => {
  const food = blackboard.getTagged('tree:grown') as Phaser.GameObjects.Components.Transform[];
  if (!food.length) { return null; }

  let dist;
  let closestDist = Infinity;
  let nearestFood = null;
  for (let i = 0; i < food.length; i++) {
    dist = Phaser.Math.Distance.BetweenPoints(food[i], position);

    if (dist > closestDist || dist > maxDistance) { continue; }
    if (dist < closestDist) {
      closestDist = dist;
      nearestFood = food[i];
    }
  }

  return nearestFood;
};
