import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button, Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import StorageLocationViewer from '../components/StorageLocationViewer';

const ScanPage = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (scannedBarcode) => {
    if (scannedBarcode) {
      setBarcode(scannedBarcode);
      fetchRecord(scannedBarcode);
      setIsScanning(false);
    }
  };

  const handleManualInput = async () => {
    if (barcode) {
      fetchRecord(barcode);
    } else {
      alert('请输入条码');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleManualInput();
    }
  };

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
    <Container maxWidth="xl">
      <Grid container spacing={3} direction={isDesktop ? 'row' : 'column'}>
        {/* 查询区域 */}
        <Grid item xs={12} md={4}>
          <Typography variant="h4" gutterBottom>
            查询记录
          </Typography>
          
          <Box sx={{ marginBottom: 3 }}>
            <TextField
              label="手工输入条码"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
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
                    handleScan(result.text);
                  }
                }}
                facingMode="environment"
                delay={500}
              />
            )}
          </Box>
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
        </Grid>
        {/* 3D显示区域 */}
        <Grid item xs={12} md={8}>
          {result && (
            <StorageLocationViewer
              location={{
                row: result.location_store,
                shelf: result.location_level,
                position: result.location_column,
              }}
              currentBarcode={result.barcode}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ScanPage;