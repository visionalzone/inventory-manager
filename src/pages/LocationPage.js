import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Typography, Container, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

// 新增分组逻辑
const groupByLocation = (data) => {
  const groups = {};
  data.forEach(item => {
    const key = `${item.location_store}-${item.location_column}-${item.location_level}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        store: item.location_store,
        column: item.location_column,
        level: item.location_level,
        items: []
      };
    }
    groups[key].items.push(item);
  });
  return Object.values(groups);
};

const LocationPage = () => {
  const [locations, setLocations] = useState([]);
  const [dialogState, setDialogState] = useState({
    open: false,
    item: null
  });

  // 优化对话框状态管理
  const handleRemoveClick = useCallback((item) => {
    setDialogState(prev => ({
      ...prev,
      open: true,
      item: item
    }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: false,
      item: null
    }));
  }, []);

  const handleConfirmRemove = async () => {
    if (!dialogState.item) return;
    
    try {
      const { error } = await supabase
        .from('computers')
        .delete()
        .eq('barcode', dialogState.item.barcode);

      if (error) throw error;
      
      alert('移出成功');
      fetchData();
    } catch (error) {
      alert('移出失败: ' + error.message);
    } finally {
      handleCloseDialog();
    }
  };

  // 优化数据获取
  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('*')
      .order('location_store');

    if (!error && data) {
      const groupedData = groupByLocation(data);
      setLocations(groupedData);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 优化渲染逻辑
  const renderItems = useCallback((items) => {
    return items.map(item => (
      <Box key={item.barcode} sx={{ 
        mb: 2, 
        p: 2, 
        border: '1px solid #ddd', 
        borderRadius: 1,
        backgroundColor: '#fff'
      }}>
        <Typography variant="body1">条码: {item.barcode}</Typography>
        <Typography variant="body1">型号: {item.model}</Typography>
        <Typography variant="body2" color="text.secondary">
          市场名称: {item.marketname}
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => handleRemoveClick(item)}
          sx={{ mt: 1.5 }}
          size="small"
        >
          移出库存
        </Button>
      </Box>
    ));
  }, [handleRemoveClick]);
  
  // 修改确认对话框的样式
  return (
    <Container sx={{ py: 4 }}>  {/* 修改这里 */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        库位管理系统
        <Button 
          variant="outlined" 
          onClick={fetchData}
          sx={{ ml: 2 }}
          size="small"
        >
          刷新数据
        </Button>
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 3 }}>
        {locations.map(location => (
          <Box key={location.id} sx={{ 
            p: 3,
            border: '1px solid #eee',
            borderRadius: 2,
            backgroundColor: '#f8f9fa'
          }}>
            <Typography variant="h6" sx={{ 
              mb: 2,
              pb: 1,
              borderBottom: '2px solid',
              borderColor: 'primary.main'
            }}>
              {location.store}库 - 第{location.column}列 - 第{location.level}层
              <Typography component="span" sx={{ ml: 1, fontSize: 14 }}>
                (共{location.items.length}件)
              </Typography>
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 2
            }}>
              {renderItems(location.items)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* 优化后的对话框 */}
      {/* Dialog 组件 */}
            <Dialog 
              open={dialogState.open}
              onClose={handleCloseDialog}
              PaperProps={{ sx: { borderRadius: 2 } }}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ bgcolor: '#f8f9fa' }}>
                确认移出操作
              </DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                {dialogState.item && (
                  <Box sx={{ 
                    p: 2,
                    bgcolor: '#fff9f9',
                    borderRadius: 1,
                    border: '1px solid #ffe0e0'
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                      即将移出以下设备：
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography>🔖 条码: {dialogState.item.barcode}</Typography>
                      <Typography>🖥️ 型号: {dialogState.item.model}</Typography>
                      <Typography>🏷️ 市场名称: {dialogState.item.marketname}</Typography>
                      <Typography>📍 位置: {dialogState.item.location_store}-{dialogState.item.location_column}-{dialogState.item.location_level}</Typography>
                    </Box>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                      ⚠️ 此操作不可撤销，请谨慎操作！
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleConfirmRemove} 
                  color="error"
                  variant="contained"
                  sx={{ 
                    borderRadius: 1,
                    '&:hover': { backgroundColor: '#d32f2f' }
                  }}
                >
                  确认移出
                </Button>
              </DialogActions>
            </Dialog>
    </Container>
  );
};

export default LocationPage;