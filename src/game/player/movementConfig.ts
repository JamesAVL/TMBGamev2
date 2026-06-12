// Movement & camera feel — single source of truth.
// Tune live via ecctrl's leva panel (?debug), then bake the numbers back here.
// ecctrl defaults are kept where they're already right: capsule 0.35/0.3,
// floatHeight 0.3, camCollision on, autoBalance on, slopeMaxAngle 1 rad (~57°).
export const movementConfig = {
  position: [0, 4, 0] as [number, number, number], // spawn drop onto slab centre
  maxVelLimit: 5, // default 2.5 is a stroll; 5 m/s reads as action-RPG run
  sprintMult: 1.6, // sprint ~8 m/s; default 2 feels skatey
  jumpVel: 4.2, // ~0.9 m standstill apex; sprint jump ~1.3 m
  camInitDis: -5.5, // mid third-person frame
  camMaxDis: -9, // generous zoom-out
  camMinDis: -1, // stop before first-person clip
};

// Facing slerp speed per scheme: camera-steered facing must snap with the
// camera (ecctrl's first-person example uses 100); classic turn-toward-travel
// reads better slower.
export const turnSpeed = {
  cameraSteered: 30,
  classic: 15,
};
