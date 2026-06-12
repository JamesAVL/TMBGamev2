import { Grid } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useSceneStore } from '../../stores/sceneStore';
import { Block } from './Block';
import { Portal } from './Portal';

// Step 1 greybox: every fixture exists to make one aspect of movement feel
// judgeable. Layout (top view, +x east, +z south, spawn at origin):
//   west  — ramp bank 15/30/45/60° (60° must refuse: > slopeMaxAngle ~57°)
//   east  — shallow + steep stair flights with landings, beam to a far block
//   north — jump-height platforms (0.5/0.9/1.3/1.8 m), then gap row (1.5–4.5 m)
//   south — camera-collision corridor, L-corner wall, low tunnel, Tundra door
//   spawn — scatter crates and a pillar for strafe/bump feel

const RAMP_LENGTH = 10;
const RAMP_THICKNESS = 0.4;

function Ramp({ angleDeg, x, color }: { angleDeg: number; x: number; color: string }) {
  const angle = (angleDeg * Math.PI) / 180;
  // Centre height puts the downhill (+z) top edge a hair below grade — no lip.
  const centerY =
    (RAMP_LENGTH / 2) * Math.sin(angle) - (RAMP_THICKNESS / 2) * Math.cos(angle) - 0.01;
  return (
    <Block
      size={[6, RAMP_THICKNESS, RAMP_LENGTH]}
      position={[x, centerY, 0]}
      rotation={[angle, 0, 0]}
      color={color}
    />
  );
}

// Solid stacked steps ascending toward -z; one rigid body, one cuboid per mesh.
function Stairs({
  x,
  zStart,
  rise,
  run,
  color,
  steps = 10,
  width = 3,
}: {
  x: number;
  zStart: number;
  rise: number;
  run: number;
  color: string;
  steps?: number;
  width?: number;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {Array.from({ length: steps }, (_, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[x, (rise * (i + 1)) / 2, zStart - run * (i + 0.5)]}
        >
          <boxGeometry args={[width, rise * (i + 1), run]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </RigidBody>
  );
}

export function Playground() {
  const setScene = useSceneStore((s) => s.setScene);
  return (
    <>
      {/* Ground slab (top at y=0) + non-physical grid for speed readability */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[80, 0.5, 80]} />
          <meshStandardMaterial color="#8a8f98" />
        </mesh>
      </RigidBody>
      <Grid
        position={[0, 0.001, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6f7480"
        sectionSize={10}
        sectionThickness={1.2}
        sectionColor="#9aa3b8"
        fadeDistance={130}
        fadeStrength={1}
      />

      {/* West: ramp bank — slope handling; the 60° one must be unclimbable */}
      <Ramp angleDeg={15} x={-13} color="#7fbf7f" />
      <Ramp angleDeg={30} x={-20} color="#d8c46a" />
      <Ramp angleDeg={45} x={-27} color="#d8915a" />
      <Ramp angleDeg={60} x={-34} color="#c95b5b" />

      {/* East: stairs — float-ray step absorption, no bounce */}
      <Stairs x={10} zStart={-2} rise={0.15} run={0.35} color="#c9b896" />
      <Block size={[3, 1.5, 3]} position={[10, 0.75, -7]} color="#c9b896" />
      <Stairs x={16} zStart={-2} rise={0.3} run={0.3} color="#b3a07e" />
      <Block size={[3, 3, 3]} position={[16, 1.5, -6.5]} color="#b3a07e" />

      {/* Beam from the shallow landing to a far block — precision steering */}
      <Block size={[0.35, 0.3, 8]} position={[10, 1.35, -12.5]} color="#b86fa8" />
      <Block size={[1, 1.5, 1]} position={[10, 0.75, -17]} color="#b86fa8" />

      {/* North: jump-height row — brackets the jump apex */}
      <Block size={[3, 0.5, 3]} position={[-18, 0.25, -15]} color="#6f87a8" />
      <Block size={[3, 0.9, 3]} position={[-13, 0.45, -15]} color="#6f87a8" />
      <Block size={[3, 1.3, 3]} position={[-8, 0.65, -15]} color="#6f87a8" />
      <Block size={[3, 1.8, 3]} position={[-3, 0.9, -15]} color="#6f87a8" />

      {/* Further north: gap row at 1 m height — edge gaps 1.5 / 2.5 / 3.5 / 4.5 m */}
      <Block size={[3, 1, 3]} position={[-16, 0.5, -24]} color="#7d9bc4" />
      <Block size={[3, 1, 3]} position={[-11.5, 0.5, -24]} color="#7d9bc4" />
      <Block size={[3, 1, 3]} position={[-6, 0.5, -24]} color="#7d9bc4" />
      <Block size={[3, 1, 3]} position={[0.5, 0.5, -24]} color="#7d9bc4" />
      <Block size={[3, 1, 3]} position={[8, 0.5, -24]} color="#7d9bc4" />

      {/* South: camera-collision corridor (1.4 m between inner faces) */}
      <Block size={[0.6, 4, 8]} position={[-1, 2, 12]} color="#5a5f6a" />
      <Block size={[0.6, 4, 8]} position={[1, 2, 12]} color="#5a5f6a" />

      {/* South-east: L-shaped corner wall — camera pull-in around corners */}
      <Block size={[12, 6, 0.6]} position={[10, 3, 22]} color="#5a5f6a" />
      <Block size={[0.6, 6, 12]} position={[16, 3, 16]} color="#5a5f6a" />

      {/* South-west: low tunnel (3 w × 2.2 h interior) — camera forced in and out */}
      <Block size={[0.6, 2.2, 8]} position={[-9.8, 1.1, 12]} color="#6a5f5a" />
      <Block size={[0.6, 2.2, 8]} position={[-6.2, 1.1, 12]} color="#6a5f5a" />
      <Block size={[4.8, 0.3, 8]} position={[-8, 2.35, 12]} color="#6a5f5a" />

      {/* Spawn area: scatter crates + pillar — strafe/bump feel, shadow sanity */}
      <Block size={[1, 1, 1]} position={[3, 0.5, 3]} color="#a8744f" />
      <Block size={[1, 1, 1]} position={[4.3, 0.5, 2.2]} color="#a8744f" />
      <Block size={[0.5, 0.5, 0.5]} position={[3, 1.25, 3]} color="#bd8a62" />
      <Block size={[0.5, 0.5, 0.5]} position={[-3, 0.25, 4]} color="#bd8a62" />
      <Block size={[1, 4, 1]} position={[-5, 2, -3]} color="#a8744f" />

      {/* The door to the Tundra — framed in glacier ice, humming quietly */}
      <Block size={[1, 3.4, 1]} position={[-2.4, 1.7, 22]} color="#9fc4dd" />
      <Block size={[1, 3.4, 1]} position={[2.4, 1.7, 22]} color="#9fc4dd" />
      <Block size={[5.8, 1, 1]} position={[0, 3.9, 22]} color="#9fc4dd" />
      <Portal position={[0, 1.7, 22]} label="THE TUNDRA" onEnter={() => setScene('tundra')} />

      {/* Perimeter rim — keeps the player on the slab (no respawn logic yet) */}
      <Block size={[80, 1.5, 0.5]} position={[0, 0.75, -39.75]} color="#4a4e57" />
      <Block size={[80, 1.5, 0.5]} position={[0, 0.75, 39.75]} color="#4a4e57" />
      <Block size={[0.5, 1.5, 80]} position={[-39.75, 0.75, 0]} color="#4a4e57" />
      <Block size={[0.5, 1.5, 80]} position={[39.75, 0.75, 0]} color="#4a4e57" />
    </>
  );
}
