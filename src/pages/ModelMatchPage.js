import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper, List, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

function ModelMatchPage() {
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [allBarcodes, setAllBarcodes] = useState([]);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatedData, setUpdatedData] = useState({});

  useEffect(() => {
    const checkApi = () => {
      console.log('Checking API availability...');
      console.log('window.api:', window.api);
      if (window.api?.invoke) {
        console.log('API is available');
        loadAllBarcodes();
      } else {
        console.error('API not found, retrying in 1 second...');
        setTimeout(checkApi, 1000);
      }
    };

    checkApi();
  }, []);

  const loadAllBarcodes = async () => {
    try {
      if (!window.api?.invoke) {
        throw new Error('API not available');
      }
      const barcodes = await window.api.invoke('get-all-barcodes');
      setAllBarcodes(barcodes);
      console.log('加载到的所有条码数据:', barcodes);
    } catch (err) {
      console.error('加载条码列表失败:', err);
      setError('加载条码列表失败: ' + err.message);
    }
  };

  const handleMatch = async () => {
    if (!barcode.trim()) {
      setError('请输入条码');
      return;
    }

    try {
      const matchResult = await window.api.invoke('find-model-by-barcode', barcode);
      console.log('查找结果:', matchResult);
      
      if (matchResult) {
        // 确保结果对象包含所有必要字段
        const processedResult = {
          ...matchResult,
          'ERP#': matchResult['ERP#'] || matchResult.Model || '无',
          MarketName: matchResult.MarketName || '无'
        };
        
        console.log('处理后的结果:', processedResult);
        setResult(processedResult);
        setError(null);
      } else {
        setResult(null);
        setError('未找到匹配记录');
      }
    } catch (err) {
      console.error('匹配过程出错:', err);
      setError(`查找出错: ${err.message}`);
      setResult(null);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!result) {
        setError('请先查找要更新的记录');
        return;
      }

      const updateResult = await window.api.invoke('update-model-data', {
        barcode: barcode
      });

      if (updateResult.success) {
        setError(null);
        setResult(updateResult.updatedRecord);
        setIsUpdateDialogOpen(false);
        // 显示成功消息
        alert('更新成功');
      }
    } catch (err) {
      console.error('更新失败:', err);
      setError(`更新失败: ${err.message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        型号匹配
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="输入条码"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleMatch();
              }
            }}
            fullWidth
          />
          <Button 
            variant="contained" 
            onClick={handleMatch}
          >
            查找
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>匹配结果：</Typography>
            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>条码：</strong> {result.Barcode}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>型号：</strong> {result['ERP#']}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                <strong>机型：</strong> {result.MarketName}
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleUpdate}
                disabled={!result['ERP#'] || result['ERP#'] === '无'}
              >
                更新到数据库
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ModelMatchPage;
