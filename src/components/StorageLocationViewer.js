import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '../supabaseClient';

const ItemsDisplay = ({ items, currentBarcode }) => {
  return items.map((item, index) => (
    <group key={item.barcode} position={[0, (item.location_level - 1) * 0.7, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 0.7, 1.5]} />
        <meshStandardMaterial
          color={item.barcode === currentBarcode ? '#87CEFA' : '#D3D3D3'} // 浅蓝色和浅灰色
          opacity={item.barcode === currentBarcode ? 0.8 : 0.4} // 调整透明度
          transparent
        />
      </mesh>
      <Text
        position={[-1.2, 0, 0.8]}  // 将 y 轴位置改为 0，与物品底部对齐
        fontSize={0.3}
        color="#666666"
        fontWeight="bold"
      >
        {`${item.location_level}层`}
      </Text>
      {item.barcode === currentBarcode && (
        <>
          <Text
            position={[2.5, 0, 0]}
            fontSize={0.3}
            color="#cc0000"
            fontWeight="bold"
          >
            {item.barcode}
          </Text>
        </>
      )}
    </group>
  ));
};

const StorageLocationViewer = ({ location, currentBarcode }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', location.row)
        .eq('location_column', location.position);

      if (!error && data) {
        const sortedData = data.sort((a, b) => a.location_level - b.location_level);
        setItems(sortedData);
      }
    };

    fetchItems();
  }, [location]);

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc' }}>
      <Canvas camera={{ position: [10, 15, 10], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <ItemsDisplay items={items} currentBarcode={currentBarcode} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[15, 15]} />
            <meshStandardMaterial color="#f0f0f0" />
          </mesh>
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI * 0.65}
            target={[0, 4, 0]}
          />
          <gridHelper args={[15, 15]} position={[0, -0.49, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default StorageLocationViewer;