import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AddPage = () => {
  const [form, setForm] = useState({
    barcode: '',
    model: '',
    marketname: '',
    location_store: 'A01',
    location_column: 1,
    location_level: 1
  });

  const [modelList, setModelList] = useState([]);
  const [modelMarketMap, setModelMarketMap] = useState({});

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

  // 处理型号变化
  const handleModelChange = (e) => {
    const selectedModel = e.target.value;
    setForm(prev => ({
      ...prev,
      model: selectedModel,
      marketname: modelMarketMap[selectedModel] || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('computers').insert([form]);
    if (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } else {
      alert('保存成功');
      // 清除条码，保留其他字段
      setForm(prev => ({
        ...prev,
        barcode: ''
      }));
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        添加记录
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="条码"
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>型号</InputLabel>
          <Select
            value={form.model}
            onChange={handleModelChange}
            label="型号"
            required
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
          value={form.marketname}
          onChange={(e) => setForm({ ...form, marketname: e.target.value })}
          fullWidth
          margin="normal"
          required
          disabled
        />
        <TextField
          label="仓库"
          value={form.location_store}
          onChange={(e) => setForm({ ...form, location_store: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="列"
          type="number"
          value={form.location_column}
          onChange={(e) => setForm({ ...form, location_column: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="层"
          type="number"
          value={form.location_level}
          onChange={(e) => setForm({ ...form, location_level: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" color="primary">
          提交
        </Button>
      </form>
    </Container>
  );
};

export default AddPage;