import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Typography, Container, Box, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, TextField } from '@mui/material';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]); // 所有库位
  const [selectedLocation, setSelectedLocation] = useState(null); // 当前选中的库位
  const [computers, setComputers] = useState([]); // 当前库位的电脑
  const [moveDialogOpen, setMoveDialogOpen] = useState(false); // 移动对话框状态
  const [selectedComputer, setSelectedComputer] = useState(null); // 当前选中的电脑
  const [targetLocation, setTargetLocation] = useState(''); // 目标库位
  const [targetColumn, setTargetColumn] = useState(1); // 目标列
  const [targetLevel, setTargetLevel] = useState(1); // 目标层

  // 获取所有库位
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('location_store')
      .order('location_store', { ascending: true });

    if (error) {
      console.error('获取库位失败:', error);
    } else {
      const uniqueLocations = [...new Set(data.map(item => item.location_store))];
      setLocations(uniqueLocations);
    }
  };

  // 获取当前库位的电脑
  const fetchComputersByLocation = async (location) => {
    const { data, error } = await supabase
      .from('computers')
      .select('*')
      .eq('location_store', location)
      .order('location_column')
      .order('location_level');

    if (error) {
      console.error('获取电脑失败:', error);
    } else {
      setComputers(data);
    }
  };
  // 处理库位点击
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    fetchComputersByLocation(location);
  };
  // 处理电脑移出
  const handleRemoveComputer = async (computer) => {
    try {
      // 1. 获取同列所有电脑
      const { data: sameColumnComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', computer.location_store)
        .eq('location_column', computer.location_column)
        .order('location_level');
  
      // 2. 找出需要更新层号的电脑
      const computersToUpdate = sameColumnComputers
        .filter(c => c.location_level > computer.location_level)
        .map(c => ({
          ...c,
          location_level: c.location_level - 1
        }));
  
      // 3. 开始事务处理
      const { error: removeError } = await supabase
        .from('computers')
        .update({
          location_store: null,
          location_column: null,
          location_level: null
        })
        .eq('barcode', computer.barcode);
  
      if (removeError) throw removeError;
  
      // 4. 更新其他电脑的层号
      if (computersToUpdate.length > 0) {
        for (const comp of computersToUpdate) {
          const { error: updateError } = await supabase
            .from('computers')
            .update({ location_level: comp.location_level })
            .eq('barcode', comp.barcode);
  
          if (updateError) throw updateError;
        }
      }
  
      // 5. 刷新当前库位的电脑列表
      fetchComputersByLocation(selectedLocation);
    } catch (error) {
      console.error('移出电脑失败:', error);
    }
  };
  // 处理电脑移动
  const handleMoveComputer = async () => {
    if (!targetLocation || !targetColumn || !targetLevel) {
      alert('请选择目标库位、列和层');
      return;
    }
  
    try {
      // 1. 获取源位置需要更新的电脑
      const { data: sourceComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', selectedComputer.location_store)
        .eq('location_column', selectedComputer.location_column)
        .gt('location_level', selectedComputer.location_level)
        .order('location_level');
  
      // 2. 获取目标位置需要更新的电脑
      const { data: targetComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', targetLocation)
        .eq('location_column', targetColumn)
        .gte('location_level', targetLevel)
        .order('location_level');
  
      // 3. 更新源位置的电脑层号（减1）
      for (const comp of sourceComputers || []) {
        await supabase
          .from('computers')
          .update({ location_level: comp.location_level - 1 })
          .eq('barcode', comp.barcode);
      }
  
      // 4. 更新目标位置的电脑层号（加1）
      for (const comp of targetComputers || []) {
        await supabase
          .from('computers')
          .update({ location_level: comp.location_level + 1 })
          .eq('barcode', comp.barcode);
      }
  
      // 5. 移动选中的电脑到目标位置
      const { error: moveError } = await supabase
        .from('computers')
        .update({
          location_store: targetLocation,
          location_column: targetColumn,
          location_level: targetLevel,
        })
        .eq('barcode', selectedComputer.barcode);
  
      if (moveError) throw moveError;
  
      // 6. 刷新显示并关闭对话框
      fetchComputersByLocation(selectedLocation);
      setMoveDialogOpen(false);
      
      // 7. 重置目标位置输入
      setTargetLocation('');
      setTargetColumn(1);
      setTargetLevel(1);
    } catch (error) {
      console.error('移动电脑失败:', error);
    }
  };
  useEffect(() => {
    fetchLocations();
  }, []);
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        库位管理
      </Typography>
  
      {/* 库位列表 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6">选择库位</Typography>
        <List>
          {locations.map((location) => (
            <ListItem button key={location} onClick={() => handleLocationClick(location)}>
              <ListItemText primary={location} />
            </ListItem>
          ))}
        </List>
      </Box>
  
      {/* 当前库位的立体堆叠效果 */}
      {selectedLocation && (
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">库位: {selectedLocation}</Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            {[...new Set(computers.map(c => c.location_column))].map((column) => (
              <Box key={column} sx={{ flex: 1 }}>
                <Typography variant="subtitle1">第 {column} 列</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    perspective: '1000px', // 透视效果
                  }}
                >
                  {computers
                    .filter(c => c.location_column === column)
                    .sort((a, b) => a.location_level - b.location_level)
                    .map((computer) => (
                      <Box
                        key={computer.barcode}
                        sx={{
                          padding: 1,
                          border: '1px solid #ccc',
                          borderRadius: 1,
                          backgroundColor: '#f9f9f9', // 默认背景色
                          position: 'relative',
                          transform: `translateY(${(computer.location_level - 1) * -10}px) rotateX(${(computer.location_level - 1) * 2}deg)`,
                          transformOrigin: 'bottom',
                          transition: 'transform 0.3s, box-shadow 0.3s, background-color 0.3s', // 添加背景色过渡
                          '&:hover': {
                            transform: `translateY(${(computer.location_level - 1) * -10}px) rotateX(${(computer.location_level - 1) * 2}deg) scale(1.05)`,
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            zIndex: 10,
                            backgroundColor: '#e3f2fd', // 悬停时背景色变为浅蓝色
                          },
                          // 新增悬停时按钮显示逻辑
                          '&:hover .button-container': {
                            opacity: 1,
                            visibility: 'visible',
                          }
                        }}
                      >
                        {/* 层次和条码 */}
                        <Typography> {computer.location_level}</Typography>
                        <Typography>{computer.barcode}</Typography>
  
                        {/* 移出和移动按钮 */}
                        <Box
                          className="button-container" // 添加类名
                          sx={{
                            position: 'absolute',
                            bottom: '30px', // 按钮放在底部
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1,
                            opacity: 0,
                            visibility: 'hidden',
                            transition: 'opacity 0.3s, visibility 0.3s',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', // 添加背景色
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                        >
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveComputer(computer);
                            }}
                          >
                            移出
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComputer(computer);
                              setMoveDialogOpen(true);
                            }}
                          >
                            移动
                          </Button>
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
  
      {/* 移动对话框 */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}>
        <DialogTitle>移动电脑</DialogTitle>
        <DialogContent>
          <Typography>将电脑 {selectedComputer?.barcode} 移动到:</Typography>
  
          {/* 目标库位 */}
          <Box sx={{ marginBottom: 2 }}>
            <Typography>目标库位</Typography>
            <Select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              fullWidth
            >
              {locations.map((location) => (
                <MenuItem key={location} value={location}>
                  {location}
                </MenuItem>
              ))}
            </Select>
          </Box>
  
          {/* 目标列 */}
          <Box sx={{ marginBottom: 2 }}>
            <Typography>目标列</Typography>
            <TextField
              type="number"
              value={targetColumn}
              onChange={(e) => setTargetColumn(parseInt(e.target.value))}
              fullWidth
            />
          </Box>
  
          {/* 目标层 */}
          <Box sx={{ marginBottom: 2 }}>
            <Typography>目标层</Typography>
            <TextField
              type="number"
              value={targetLevel}
              onChange={(e) => setTargetLevel(parseInt(e.target.value))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>取消</Button>
          <Button onClick={handleMoveComputer}>确认</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LocationManagement;