import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Typography, Container, TextField, Button } from '@mui/material';

const AddPage = () => {
  const [form, setForm] = useState({
    barcode: '',
    model: '',
    marketname: '',
    location_store: 'A区',
    location_column: 1,
    location_level: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('computers').insert([form]);
    if (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } else {
      alert('保存成功');
    }
  };

  return (
    <Container>
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
        <TextField
          label="型号"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="市场名称"
          value={form.marketname}
          onChange={(e) => setForm({ ...form, marketname: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="仓库"
          value={form.location_store}
          onChange={(e) => setForm({ ...form, store: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="列"
          type="number"
          value={form.location_column}
          onChange={(e) => setForm({ ...form, column: parseInt(e.target.value) })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="层"
          type="number"
          value={form.location_level}
          onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
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