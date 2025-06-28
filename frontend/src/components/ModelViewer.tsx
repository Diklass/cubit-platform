// frontend/src/components/ModelViewer.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';

type ModelViewerProps = {
  url: string;
  width?: number;
  height?: number;
};

export const ModelViewer: React.FC<ModelViewerProps> = ({
  url,
  width = 400,
  height = 300,
}) => {
  const { scene } = useGLTF(url);

  return (
    <div style={{ width, height, border: '1px solid #ccc' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
        {/* нижний регистр! */}

        <Suspense fallback={null}>
          {/* primitive — особый JSX-элемент для вставки трёхмерного объекта */}
          {/* @ts-expect-error react-three-fiber */}
          <primitive object={scene} />
          <Environment preset="warehouse" />
        </Suspense>

        <OrbitControls />
      </Canvas>
    </div>
  );
};
