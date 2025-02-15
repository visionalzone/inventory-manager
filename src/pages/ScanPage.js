import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button, Box } from '@mui/material';

const ScanPage = () => {
  const [barcode, setBarcode] = useState(''); // 手工录入的条码
  const [result, setResult] = useState(null); // 查询结果
  const [isScanning, setIsScanning] = useState(false); // 是否启用扫码

  // 处理扫码结果
  const handleScan = (scannedBarcode) => {
    if (scannedBarcode) {
      setBarcode(scannedBarcode); // 将扫码结果填入输入框
      fetchRecord(scannedBarcode); // 查询记录
      setIsScanning(false); // 扫码成功后关闭摄像头
    }
  };

  // 处理手工录入
  const handleManualInput = async () => {
    if (barcode) {
      fetchRecord(barcode); // 查询记录
    } else {
      alert('请输入条码');
    }
  };

  // 查询记录
  const fetchRecord = async (barcode) => {
    const { data, error } = await supabase
      .from('computers')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      console.error('查询失败:', error);
      setResult({ error: '未找到设备' });
    } else {
      setResult(data);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        查询记录
      </Typography>

      {/* 手工录入 */}
      <Box sx={{ marginBottom: 3 }}>
        <TextField
          label="手工输入条码"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleManualInput}
          sx={{ marginTop: 2 }}
        >
          查询
        </Button>
      </Box>

      {/* 扫码录入 */}
      <Box sx={{ marginBottom: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsScanning(!isScanning)}
          sx={{ marginBottom: 2 }}
        >
          {isScanning ? '停止扫码' : '开始扫码'}
        </Button>
        {isScanning && (
          <BarcodeScannerComponent
            onUpdate={(err, result) => {
              if (result) {
                console.log('扫描结果:', result.text);
                handleScan(result.text);
              }
              if (err) {
                console.error('扫描错误:', err);
              }
            }}
            facingMode="environment"
            delay={500}
          />
        )}
      </Box>

      {/* 显示查询结果 */}
      {result?.error ? (
        <Typography color="error">{result.error}</Typography>
      ) : result && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6">设备信息</Typography>
          <Typography>条码: {result.barcode}</Typography>
          <Typography>型号: {result.model}</Typography>
          <Typography>市场名称: {result.marketname}</Typography>
          <Typography>
            位置: {result.location_store}库 {result.location_column}列 {result.location_level}层
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ScanPage;