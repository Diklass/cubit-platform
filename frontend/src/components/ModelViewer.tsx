// frontend/src/components/ModelViewer.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';

type ModelViewerProps = {
  url: string;
  width?: number;
  height?: number;
};

function InnerModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  url,
  width = 400,
  height = 300,
}) => (
  <div style={{ width, height, border: '1px solid #ccc' }}>
    <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
      <ambientLight />
      <directionalLight position={[5, 5, 5]} />
      <Suspense fallback={null}>
        <InnerModel url={url} />
        <Environment preset="warehouse" />
      </Suspense>
      <OrbitControls />
    </Canvas>
  </div>
);
