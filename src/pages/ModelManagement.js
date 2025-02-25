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
  IconButton,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [marketName, setMarketName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // 获取所有型号数据
  const fetchModels = async () => {
    const { data, error } = await supabase
      .from('model_market_names')
      .select('*')
      .order('model');

    if (error) {
      setError('获取数据失败: ' + error.message);
    } else {
      setModels(data);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 删除型号
  const handleDelete = async (model) => {
    try {
      const { error } = await supabase
        .from('model_market_names')
        .delete()
        .eq('model', model);

      if (error) throw error;
      setSuccess('删除成功');
      fetchModels();
    } catch (err) {
      setError('删除失败: ' + err.message);
    }
  };

  // 型号检索功能
  const handleSearch = async () => {
    if (!model.trim()) {
      setError('请输入型号');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const { data, error: searchError } = await supabase
        .from('model_market_names')
        .select('*')
        .eq('model', model.trim())
        .single();

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          // 未找到记录，可以添加
          setSearchResult({ exists: false, message: '未找到记录，可以添加新型号' });
        } else {
          throw searchError;
        }
      } else {
        // 找到记录
        setSearchResult({
          exists: true,
          data,
          message: '该型号已存在，请勿重复添加'
        });
        setMarketName(data.market_name);
      }
    } catch (err) {
      setError(`检索失败: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!model.trim() || !marketName.trim()) {
      setError('型号和市场名称都是必填项');
      return;
    }

    // 如果已存在记录，阻止提交
    if (searchResult?.exists) {
      setError('该型号已存在，请勿重复添加');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('model_market_names')
        .insert([
          {
            model: model.trim(),
            market_name: marketName.trim()
          }
        ]);

      if (insertError) throw insertError;

      setSuccess('型号添加成功');
      setModel('');
      setMarketName('');
      setSearchResult(null);
    } catch (err) {
      setError(`添加失败: ${err.message}`);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        型号管理
      </Typography>

      {/* 型号检索和添加表单 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="型号"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
              required
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={isSearching || !model.trim()}
            >
              检索
            </Button>
          </Box>

          {searchResult && (
            <Alert severity={searchResult.exists ? "warning" : "info"}>
              {searchResult.message}
            </Alert>
          )}

          <TextField
            label="市场名称"
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            fullWidth
            required
          />

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 1 }}>
              {success}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isSearching || searchResult?.exists}
            sx={{ mt: 2 }}
          >
            添加型号
          </Button>
        </Box>
      </Paper>

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