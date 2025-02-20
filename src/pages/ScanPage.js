import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import StorageLocationViewer from '../components/StorageLocationViewer';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const ScanPage = () => {
  const [barcode, setBarcode] = useState('');
  const [record, setRecord] = useState(null);
  const [modelList, setModelList] = useState([]);
  const [modelMarketMap, setModelMarketMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [computerToDelete, setComputerToDelete] = useState(null);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const handleUpdateModel = async () => {
    if (!record || record.model !== '未知型号') return;
    
    setIsUpdatingModel(true);
    try {
      const response = await fetch('http://localhost:3001/api/update-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: record.barcode
        })
      });

      if (!response.ok) {
        throw new Error('获取型号失败');
      }

      const data = await response.json();
      if (data.model) {
        // 更新数据库
        const { error } = await supabase
          .from('computers')
          .update({ model: data.model })
          .eq('barcode', record.barcode);

        if (error) throw error;

        // 更新显示
        setRecord({ ...record, model: data.model });
        alert('型号更新成功');
      }
    } catch (error) {
      console.error('更新型号失败:', error);
      alert('更新失败，请稍后重试');
    } finally {
      setIsUpdatingModel(false);
    }
  };

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

  const handleScan = (err, result) => {
    if (result) {
      setBarcode(result.text);
      setScanning(false);
      handleSearch();
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('computers')
        .delete()
        .eq('barcode', computerToDelete.barcode);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setComputerToDelete(null);
      setRecord(null);
      setBarcode('');
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        查询记录
      </Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* 左侧查询部分 */}
        <Box sx={{ 
          flex: '0 0 30%',
          maxWidth: '400px'
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
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setIsEditing(true)}
                    >
                      修改型号
                    </Button>
                    {record.model === '未知型号' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleUpdateModel}
                        disabled={isUpdatingModel}
                      >
                        {isUpdatingModel ? '更新中...' : '自动获取型号'}
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setComputerToDelete(record);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      删除
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* 右侧 3D 展示部分 */}
        <Box sx={{ 
          flex: '0 0 70%',
          height: '800px',
          position: 'sticky',
          top: 20,
          overflow: 'hidden'
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

      {/* 删除确认对话框 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#fff9f9' }}>
          确认删除记录
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {computerToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                您确定要删除以下记录吗？
              </Typography>
              <Box sx={{ pl: 2, mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  条码: {computerToDelete.barcode}
                </Typography>
                {computerToDelete.location_store && (
                  <Typography variant="body2" gutterBottom>
                    位置: {computerToDelete.location_store}-
                    {computerToDelete.location_column}-
                    {computerToDelete.location_level}
                  </Typography>
                )}
              </Box>
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ mt: 2 }}
              >
                此操作不可撤销！
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScanPage;