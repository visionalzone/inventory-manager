import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Typography,
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const [newModel, setNewModel] = useState({ model: '', market_name: '' });
  const [message, setMessage] = useState('');

  // 获取所有型号数据
  const fetchModels = async () => {
    const { data, error } = await supabase
      .from('model_market_names')
      .select('*')
      .order('model');

    if (error) {
      setMessage('获取数据失败: ' + error.message);
    } else {
      setModels(data);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 添加新型号
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newModel.model || !newModel.market_name) {
      setMessage('请填写完整信息');
      return;
    }

    const { error } = await supabase
      .from('model_market_names')
      .insert([newModel]);

    if (error) {
      setMessage('添加失败: ' + error.message);
    } else {
      setMessage('添加成功');
      setNewModel({ model: '', market_name: '' });
      fetchModels();
    }
  };

  // 删除型号
  const handleDelete = async (model) => {
    const { error } = await supabase
      .from('model_market_names')
      .delete()
      .eq('model', model);

    if (error) {
      setMessage('删除失败: ' + error.message);
    } else {
      setMessage('删除成功');
      fetchModels();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        型号管理
      </Typography>

      {/* 添加新型号表单 */}
      <Box component="form" onSubmit={handleAdd} sx={{ mb: 4 }}>
        <TextField
          label="型号"
          value={newModel.model}
          onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
          sx={{ mr: 2 }}
          required
        />
        <TextField
          label="市场名称"
          value={newModel.market_name}
          onChange={(e) => setNewModel({ ...newModel, market_name: e.target.value })}
          sx={{ mr: 2 }}
          required
        />
        <Button type="submit" variant="contained" color="primary">
          添加
        </Button>
      </Box>

      {/* 提示信息 */}
      {message && (
        <Typography color={message.includes('失败') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}

      {/* 型号列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>型号</TableCell>
              <TableCell>市场名称</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((item) => (
              <TableRow key={item.model}>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.market_name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDelete(item.model)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ModelManagement;