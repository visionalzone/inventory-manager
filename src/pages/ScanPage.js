import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { supabase } from '../supabaseClient';
import { Typography, Container } from '@mui/material';

const ScanPage = () => {
  const [result, setResult] = useState(null);

  const handleScan = async (barcode) => {
    const { data } = await supabase
      .from('computers')
      .select('*')
      .eq('barcode', barcode)
      .single();

    setResult(data || { error: '未找到设备' });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        查询记录
      </Typography>
      <BarcodeScannerComponent
        onUpdate={(err, result) => result && handleScan(result.text)}
        facingMode="environment"
      />
      {result?.error ? (
        <Typography color="error">{result.error}</Typography>
      ) : result && (
        <div>
          <Typography variant="h6">{result.model}</Typography>
          <Typography>
            位置：{result.location_store}库 {result.location_column}列 {result.location_level}层
          </Typography>
        </div>
      )}
    </Container>
  );
};

export default ScanPage;