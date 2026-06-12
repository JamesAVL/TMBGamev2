export function Lights() {
  return (
    <>
      <hemisphereLight args={['#bdd2ff', '#3f3a33', 0.35]} />
      <directionalLight
        position={[18, 24, 12]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
    </>
  );
}
