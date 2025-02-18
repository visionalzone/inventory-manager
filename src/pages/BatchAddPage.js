import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Typography, Container, Box, TextField, Button, Select, MenuItem } from '@mui/material';

const BatchAddPage = () => {
  const [location, setLocation] = useState(''); // 选择的库位
  const [column, setColumn] = useState(1); // 选择的列
  const [barcodes, setBarcodes] = useState(''); // 输入的条码列表
  const [message, setMessage] = useState(''); // 操作提示信息

  // 处理批量添加
  const handleBatchAdd = async () => {
    if (!location || !barcodes) {
      setMessage('请填写库位和条码');
      return;
    }

    const barcodeList = barcodes.split('\n').filter(barcode => barcode.trim() !== ''); // 按行分割条码
    const records = barcodeList.map((barcode, index) => ({
      barcode: barcode.trim(),
      model: '未知型号', // 默认型号
      marketname: '未知市场名称', // 默认市场名称
      location_store: location,
      location_column: column,
      location_level: index + 1, // 层次从1开始
    }));

    const { error } = await supabase.from('computers').insert(records);

    if (error) {
      setMessage('批量添加失败: ' + error.message);
    } else {
      setMessage('批量添加成功');
      setBarcodes(''); // 清空输入框
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        批量增加记录
      </Typography>

      {/* 库位选择 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6">选择库位</Typography>
        <TextField
          label="库位"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </Box>

      {/* 列选择 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6">选择列</Typography>
        <Select
          value={column}
          onChange={(e) => setColumn(e.target.value)}
          fullWidth
        >
          {[...Array(10).keys()].map((i) => (
            <MenuItem key={i + 1} value={i + 1}>
              第 {i + 1} 列
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* 条码输入 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6">输入条码（每行一个）</Typography>
        <TextField
          label="条码"
          value={barcodes}
          onChange={(e) => setBarcodes(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={10}
          required
        />
      </Box>

      {/* 操作按钮 */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleBatchAdd}
        sx={{ marginBottom: 3 }}
      >
        批量添加
      </Button>

      {/* 提示信息 */}
      {message && (
        <Typography color={message.includes('失败') ? 'error' : 'success'}>
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default BatchAddPage;