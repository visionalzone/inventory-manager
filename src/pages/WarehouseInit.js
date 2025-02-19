import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const WarehouseInit = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState({ type: '', message: '' });

  const handleClearDatabase = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('computers')
        .delete()
        .not('barcode', 'eq', ''); // 使用 barcode 字段替代 id

      if (error) throw error;

      setResult({
        type: 'success',
        message: '数据库已成功清空'
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: '操作失败: ' + error.message
      });
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#333' }}>
          仓库初始化
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, bgcolor: '#fff9f9', borderRadius: 2, border: '1px solid #ffebee' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f' }}>
            危险操作区
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            清空数据库将删除所有设备记录，此操作不可恢复。
            请确保您已经备份了所需的数据。
          </Typography>

          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={isProcessing}
            sx={{
              py: 1.5,
              px: 4,
              '&:hover': {
                backgroundColor: '#b71c1c'
              }
            }}
          >
            清空数据库
          </Button>
        </Box>

        {result.message && (
          <Alert 
            severity={result.type} 
            sx={{ mt: 2 }}
            onClose={() => setResult({ type: '', message: '' })}
          >
            {result.message}
          </Alert>
        )}
      </Box>

      {/* 确认对话框 */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#fff9f9' }}>
          ⚠️ 确认清空数据库
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            您确定要清空数据库吗？此操作将：
          </Typography>
          <Box sx={{ pl: 2, mt: 1 }}>
            <Typography variant="body2" color="error" gutterBottom>
              • 删除所有设备记录
            </Typography>
            <Typography variant="body2" color="error" gutterBottom>
              • 清空所有库位信息
            </Typography>
            <Typography variant="body2" color="error">
              • 此操作无法撤销
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleClearDatabase}
            color="error"
            variant="contained"
            disabled={isProcessing}
          >
            确认清空
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WarehouseInit;