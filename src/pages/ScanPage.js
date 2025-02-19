import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import StorageLocationViewer from '../components/StorageLocationViewer';

const ScanPage = () => {
  const [barcode, setBarcode] = useState('');
  const [record, setRecord] = useState(null);
  const [modelList, setModelList] = useState([]);
  const [modelMarketMap, setModelMarketMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // 获取型号列表
  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('model_market_names')
        .select('*')
        .order('model');
      
      if (!error && data) {
        setModelList(data);
        const mapping = data.reduce((acc, item) => {
          acc[item.model] = item.market_name;
          return acc;
        }, {});
        setModelMarketMap(mapping);
      }
    };

    fetchModels();
  }, []);

  const handleSearch = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      alert('查询失败: ' + error.message);
    } else if (data) {
      setRecord(data);
      setEditForm(data);
    } else {
      alert('未找到记录');
      setRecord(null);
      setEditForm(null);
    }
  };

  const handleModelChange = (e) => {
    const selectedModel = e.target.value;
    setEditForm(prev => ({
      ...prev,
      model: selectedModel,
      marketname: modelMarketMap[selectedModel] || ''
    }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('computers')
      .update({
        model: editForm.model,
        marketname: editForm.marketname
      })
      .eq('barcode', barcode);

    if (error) {
      alert('更新失败: ' + error.message);
    } else {
      alert('更新成功');
      setRecord(editForm);
      setIsEditing(false);
    }
  };
  const [scanning, setScanning] = useState(false);  // 添加扫码状态
  const handleScan = (err, result) => {
    if (result) {
      setBarcode(result.text);
      setScanning(false);
      // 自动执行查询
      handleSearch();
    }
  };
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        查询记录
      </Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* 左侧查询部分 */}
        <Box sx={{ 
          flex: '0 0 30%',  // 固定为30%宽度
          maxWidth: '400px' // 设置最大宽度
        }}>
          <Box sx={{ mb: 4 }}>
            <TextField
              label="条码"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleSearch}>
                查询
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setScanning(!scanning)}
                color={scanning ? "error" : "primary"}
              >
                {scanning ? "关闭扫码" : "打开扫码"}
              </Button>
            </Box>
          </Box>

          {scanning && (
            <Box sx={{ mb: 4, width: '100%', maxWidth: '500px' }}>
              <BarcodeScannerComponent
                width="100%"
                onUpdate={handleScan}
              />
            </Box>
          )}

          {record && (
            <Box>
              <Typography variant="h6" gutterBottom>
                查询结果
              </Typography>
              {isEditing ? (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>型号</InputLabel>
                    <Select
                      value={editForm.model}
                      onChange={handleModelChange}
                      label="型号"
                    >
                      {modelList.map((item) => (
                        <MenuItem key={item.model} value={item.model}>
                          {item.model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="市场名称"
                    value={editForm.marketname}
                    fullWidth
                    margin="normal"
                    disabled
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSave} sx={{ mr: 2 }}>
                      保存
                    </Button>
                    <Button variant="outlined" onClick={() => setIsEditing(false)}>
                      取消
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography>型号: {record.model}</Typography>
                  <Typography>市场名称: {record.marketname}</Typography>
                  <Typography>仓库: {record.location_store}</Typography>
                  <Typography>列: {record.location_column}</Typography>
                  <Typography>层: {record.location_level}</Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => setIsEditing(true)}
                    sx={{ mt: 2 }}
                  >
                    修改型号
                  </Button>
                </>
              )}
            </Box>
          )}
        </Box>
        {/* 右侧 3D 展示部分 */}
        <Box sx={{ 
          flex: '0 0 70%',    // 固定为70%宽度
          height: '800px',    // 固定高度
          position: 'sticky', // 固定位置
          top: 20,           // 距离顶部距离
          overflow: 'hidden'  // 防止内容溢出
        }}>
          {record && (
            <StorageLocationViewer 
              location={{
                row: record.location_store,
                position: record.location_column
              }}
              currentBarcode={record.barcode}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ScanPage;