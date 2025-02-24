import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Typography, 
  Container, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Select, 
  MenuItem, 
  TextField,
  Card,
  CardContent
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';

const LocationManagement = () => {
  const [totalItems, setTotalItems] = useState(0);
  const [locations, setLocations] = useState([]); // 所有库位
  const [selectedLocation, setSelectedLocation] = useState(null); // 当前选中的库位
  const [computers, setComputers] = useState([]); // 当前库位的电脑
  const [moveDialogOpen, setMoveDialogOpen] = useState(false); // 移动对话框状态
  const [selectedComputer, setSelectedComputer] = useState(null); // 当前选中的电脑
  const [targetLocation, setTargetLocation] = useState(''); // 目标库位
  const [targetColumn, setTargetColumn] = useState(1); // 目标列
  const [targetLevel, setTargetLevel] = useState(1); // 目标层
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [computerToRemove, setComputerToRemove] = useState(null);
  const [unknownModelCount, setUnknownModelCount] = useState(0); // 未知型号数量

  // 新增：检查并整理层数
  const reorganizeLevels = async (locationStore, column) => {
    try {
      // 1. 获取当前列的所有电脑
      const { data: columnComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', locationStore)
        .eq('location_column', column)
        .order('location_level');

      if (!columnComputers || columnComputers.length === 0) return;

      // 2. 检查层数是否连续
      const needsReorganization = columnComputers.some((comp, index) => 
        comp.location_level !== index + 1
      );

      if (needsReorganization) {
        // 3. 重新分配层数
        const updates = columnComputers.map((comp, index) => ({
          ...comp,
          location_level: index + 1
        }));

        // 4. 批量更新
        await Promise.all(
          updates.map(comp =>
            supabase
              .from('computers')
              .update({ location_level: comp.location_level })
              .eq('barcode', comp.barcode)
          )
        );

        // 5. 刷新显示
        await fetchComputersByLocation(locationStore);
      }
    } catch (error) {
      console.error('整理层数失败:', error);
    }
  };

  const handleRemoveComputer = async (computer) => {
    try {
      // 1. 获取同一列中所有电脑并按层数排序
      const { data: sameColumnComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', computer.location_store)
        .eq('location_column', computer.location_column)
        .order('location_level');

      // 2. 移出选中的电脑
      const { error: removeError } = await supabase
        .from('computers')
        .update({
          location_store: null,
          location_column: null,
          location_level: null
        })
        .eq('barcode', computer.barcode);

      if (removeError) throw removeError;

      // 3. 重新排序剩余电脑的层数
      const remainingComputers = sameColumnComputers
        .filter(c => c.barcode !== computer.barcode)
        .map((c, index) => ({
          ...c,
          location_level: index + 1  // 重新分配层数，从1开始
        }));

      // 4. 批量更新剩余电脑的层数
      for (const comp of remainingComputers) {
        await supabase
          .from('computers')
          .update({ location_level: comp.location_level })
          .eq('barcode', comp.barcode);
      }

      // 移出后整理层数
      await reorganizeLevels(computer.location_store, computer.location_column);
      
      // 5. 刷新显示
      await fetchComputersByLocation(selectedLocation);
      await fetchTotalItems();
    } catch (error) {
      console.error('移出电脑失败:', error);
      alert('移出失败: ' + error.message);
    }
  };
  const handleRemoveClick = (computer) => {
    setComputerToRemove(computer);
    setRemoveDialogOpen(true);
  };
  const handleConfirmRemove = async () => {
    if (computerToRemove) {
      await handleRemoveComputer(computerToRemove);
      setRemoveDialogOpen(false);
      setComputerToRemove(null);
    }
  };
  const handleMoveComputer = async () => {
    if (!targetLocation || !targetColumn || !targetLevel) {
      alert('请选择目标库位、列和层');
      return;
    }

    try {
      // 1. 获取源位置和目标位置的所有电脑
      const { data: currentComputers } = await supabase
        .from('computers')
        .select('*')
        .eq('location_store', targetLocation)
        .eq('location_column', targetColumn)
        .order('location_level');

      // 2. 判断是否是同列移动
      const isSameColumn = targetLocation === selectedComputer.location_store && 
                          targetColumn === selectedComputer.location_column;

      // 3. 处理移动逻辑
      if (isSameColumn) {
        // 同列移动
        const otherComputers = currentComputers.filter(c => c.barcode !== selectedComputer.barcode);
        const updates = [];

        // 更新选中的电脑
        updates.push({
          barcode: selectedComputer.barcode,
          location_level: targetLevel
        });

        // 更新其他电脑的层数
        otherComputers.forEach(comp => {
          let newLevel = comp.location_level;
          
          if (selectedComputer.location_level < targetLevel) {
            // 向上移动：当前层在源位置和目标位置之间的电脑层数减1
            if (comp.location_level > selectedComputer.location_level && 
                comp.location_level <= targetLevel) {
              newLevel = comp.location_level - 1;
            }
          } else {
            // 向下移动：当前层在目标位置和源位置之间的电脑层数加1
            if (comp.location_level >= targetLevel && 
                comp.location_level < selectedComputer.location_level) {
              newLevel = comp.location_level + 1;
            }
          }

          updates.push({
            barcode: comp.barcode,
            location_level: newLevel
          });
        });

        // 执行批量更新
        for (const update of updates) {
          await supabase
            .from('computers')
            .update({ location_level: update.location_level })
            .eq('barcode', update.barcode);
        }
      } else {
        // 不同列移动的逻辑保持不变
        const [sourceResponse, targetResponse] = await Promise.all([
          supabase
            .from('computers')
            .select('*')
            .eq('location_store', selectedComputer.location_store)
            .eq('location_column', selectedComputer.location_column)
            .order('location_level'),
          supabase
            .from('computers')
            .select('*')
            .eq('location_store', targetLocation)
            .eq('location_column', targetColumn)
            .order('location_level')
        ]);

        // 2. 处理源位置的电脑（移除选中的电脑并重新排序）
        const remainingSourceComputers = sourceResponse.data
          .filter(c => c.barcode !== selectedComputer.barcode)
          .map((c, index) => ({
            ...c,
            location_level: index + 1
          }));

        // 3. 处理目标位置的电脑
        let targetComputers = targetResponse.data || [];
        
        // 3.1 如果是同一列内移动，需要特殊处理
        if (targetLocation === selectedComputer.location_store && 
            targetColumn === selectedComputer.location_column) {
          // 判断移动方向
          const isMovingDown = targetLevel > selectedComputer.location_level;
          
          targetComputers = targetComputers
            .filter(c => c.barcode !== selectedComputer.barcode) // 移除当前电脑
            .map(c => {
              if (isMovingDown) {
                // 向下移动：调整目标层到当前层之间的电脑
                if (c.location_level > selectedComputer.location_level && 
                    c.location_level <= targetLevel) {
                  return { ...c, location_level: c.location_level - 1 };
                }
              } else {
                // 向上移动：调整目标层到当前层之间的电脑
                if (c.location_level >= targetLevel && 
                    c.location_level < selectedComputer.location_level) {
                  return { ...c, location_level: c.location_level + 1 };
                }
              }
              return c;
            });
        } else {
          // 不同列的移动
          targetComputers = targetComputers
            .map(c => {
              if (c.location_level >= targetLevel) {
                return { ...c, location_level: c.location_level + 1 };
              }
              return c;
            });
        }

        // 4. 执行更新操作
        await Promise.all([
          // 更新源位置的电脑
          ...remainingSourceComputers.map(c => 
            supabase
              .from('computers')
              .update({
                location_level: c.location_level
              })
              .eq('barcode', c.barcode)
          ),
          // 更新目标位置的所有电脑
          ...targetComputers.map(c => 
            supabase
              .from('computers')
              .update({
                location_level: c.location_level
              })
              .eq('barcode', c.barcode)
          ),
          // 移动选中的电脑到目标位置
          supabase
            .from('computers')
            .update({
              location_store: targetLocation,
              location_column: targetColumn,
              location_level: targetLevel
            })
            .eq('barcode', selectedComputer.barcode)
        ]);

        // 5. 检查并整理层数
        await reorganizeLevels(selectedComputer.location_store, selectedComputer.location_column);
        if (targetLocation !== selectedComputer.location_store || 
            targetColumn !== selectedComputer.location_column) {
          await reorganizeLevels(targetLocation, targetColumn);
        }
      }

      // 6. 刷新显示
      await fetchComputersByLocation(selectedLocation);
      setMoveDialogOpen(false);
      resetMoveForm();
    } catch (error) {
      console.error('移动电脑失败:', error);
      alert('移动失败: ' + error.message);
    }
  };
  const resetMoveForm = () => {
    setTargetLocation('');
    setTargetColumn(1);
    setTargetLevel(1);
  };
  // 获取所有库位
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('location_store')
      .not('location_store', 'is', null)
      .order('location_store');
  
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
  // 获取在库物件总数
  const fetchTotalItems = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('barcode')
      .not('location_store', 'is', null);

    if (error) {
      console.error('获取总数失败:', error);
    } else {
      setTotalItems(data.length);
    }
  };
  // 获取未知型号的数量
  const fetchUnknownModelCount = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('barcode')
      .eq('model', '未知型号')
      .not('location_store', 'is', null);
  
    if (error) {
      console.error('获取未知型号数量失败:', error);
    } else {
      setUnknownModelCount(data.length);
    }
  };
  // 处理库位点击
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    fetchComputersByLocation(location);
  };
  useEffect(() => {
    fetchLocations();
    fetchTotalItems();
    fetchUnknownModelCount(); // 获取未知型号数量
  }, []);
  return (
    <Container sx={{ mt: 4 }}>  {/* 添加上边距 mt: 4 表示 margin-top: 32px */}
      <Typography variant="h4" gutterBottom>
        库位管理
      </Typography>

      {/* 显示在库物件总数和未知型号数量 */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" color="primary">
                  当前在库物件总数
                </Typography>
                <Typography variant="h3">
                  {totalItems}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" color="secondary">
                  未知型号数量
                </Typography>
                <Typography variant="h3">
                  {unknownModelCount}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
  
      {/* 库位列表 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6">选择库位</Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          mt: 1 
        }}>
          {locations.map((location) => (
            <Button
              key={location}
              variant={selectedLocation === location ? "contained" : "outlined"}
              onClick={() => handleLocationClick(location)}
              sx={{ minWidth: '100px' }}
            >
              {location}
            </Button>
          ))}
        </Box>
      </Box>
  {/* 当前库位的立体堆叠效果 */}
      {selectedLocation && (
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">库位: {selectedLocation}</Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            justifyContent: 'flex-start'  // 左对齐
          }}>
            {[...new Set(computers.map(c => c.location_column))].map((column) => (
              <Box key={column} sx={{ 
                width: '140px',
                minWidth: '140px',
                marginBottom: 2  // 添加底部间距
              }}>
                {/* 其他内容保持不变 */}
                <Typography variant="subtitle1">第 {column} 列</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    perspective: '1000px'
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
                          backgroundColor: '#f9f9f9',
                          position: 'relative',
                          transform: `translateY(${(computer.location_level - 1) * -10}px) rotateX(${(computer.location_level - 1) * 2}deg)`,
                          transformOrigin: 'bottom',
                          transition: 'transform 0.3s, box-shadow 0.3s, background-color 0.3s',
                          '&:hover': {
                            transform: `translateY(${(computer.location_level - 1) * -10}px) rotateX(${(computer.location_level - 1) * 2}deg) scale(1.05)`,
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            zIndex: 10,
                            backgroundColor: '#e3f2fd'
                          },
                          '&:hover .button-container': {
                            opacity: 1,
                            visibility: 'visible'
                          }
                        }}
                      >
                        <Typography sx={{ 
                          fontSize: '0.875rem',
                          color: '#666',
                          fontWeight: 400,
                          letterSpacing: '0.01em'
                        }}>
                          第 {computer.location_level} 层
                        </Typography>
                        <Typography sx={{ 
                          fontSize: '0.9rem',
                          color: '#2196f3',
                          fontWeight: 500,
                          letterSpacing: '0.02em',
                          mt: 0.5
                        }}>
                          {computer.barcode}
                        </Typography>
                        {/* 按钮容器部分保持不变 */}
                        <Box
                          className="button-container"
                          sx={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1,
                            opacity: 0,
                            visibility: 'hidden',
                            transition: 'opacity 0.3s, visibility 0.3s',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveClick(computer);
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
      {/* 添加移出确认对话框 */}
      <Dialog 
        open={removeDialogOpen} 
        onClose={() => setRemoveDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa' }}>
          确认移出操作
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {computerToRemove && (
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
                <Typography>🔖 条码: {computerToRemove.barcode}</Typography>
                <Typography>📍 位置: {computerToRemove.location_store}-{computerToRemove.location_column}-{computerToRemove.location_level}</Typography>
              </Box>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                ⚠️ 此操作将清空该设备的库位信息，请谨慎操作！
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setRemoveDialogOpen(false)}
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

export default LocationManagement;