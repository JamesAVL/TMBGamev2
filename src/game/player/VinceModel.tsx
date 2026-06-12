import { ToonOutline } from '../look/ToonOutline';
import { getGradientMap } from '../look/toon';
// Vince Noir, greybox edition: slim, glam, and a black hurricane of hair.
// Offset down by floatHeight (0.3) — ecctrl floats its capsule by design.
export function VinceModel() {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Slim glam body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.27, 0.75, 6, 16]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#b8c4e8" />
        <ToonOutline />
      </mesh>
      {/* Scarf */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <torusGeometry args={[0.26, 0.07, 8, 16]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#d84f9a" />
      </mesh>
      {/* The hair. The whole point. */}
      <mesh castShadow position={[0, 0.62, -0.05]}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#101014" />
        <ToonOutline />
      </mesh>
      <mesh castShadow position={[-0.16, 0.52, -0.12]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#101014" />
      </mesh>
      <mesh castShadow position={[0.16, 0.52, -0.12]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#101014" />
      </mesh>
      <mesh castShadow position={[0, 0.45, -0.22]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#101014" />
      </mesh>
      {/* Face on +Z (glTF forward — the way ecctrl turns) */}
      <mesh position={[-0.09, 0.45, 0.24]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#f4f1e8" />
      </mesh>
      <mesh position={[0.09, 0.45, 0.24]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#f4f1e8" />
      </mesh>
      {/* The can of hairspray, holstered forward */}
      <mesh castShadow position={[0.26, 0.05, 0.18]}>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#e8e4da" />
      </mesh>
    </group>
  );
}
