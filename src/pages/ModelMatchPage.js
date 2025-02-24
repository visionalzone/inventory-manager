import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import {
  Container,
  Typography,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { CheckCircle, Error, Info } from '@mui/icons-material';

const ModelMatchPage = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // 读取Excel文件
  const readExcelFile = async () => {
    try {
      const response = await fetch('/model.xlsx');
      if (!response.ok) throw new Error('Excel文件加载失败');
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } catch (err) {
      throw new Error(`Excel文件读取失败: ${err.message}`);
    }
  };

  // 获取市场名称
  const getMarketName = async (model) => {
    const { data, error } = await supabase
      .from('model_market_names')
      .select('market_name')
      .eq('model', model)
      .single();

    if (error) {
      console.warn(`未找到型号 ${model} 的市场名称`);
      return null;
    }
    return data.market_name;
  };

  // 主处理函数
  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // 步骤1：读取Excel数据
      const excelData = await readExcelFile();
      if (!excelData.length) throw new Error('Excel文件为空');

      // 步骤2：获取需要处理的记录
      const { data: computers, error: fetchError } = await supabase
        .from('computers')
        .select('barcode, model, marketname')
        .eq('model', '未知型号');

      if (fetchError) throw fetchError;
      if (!computers.length) {
        setError('没有需要处理的记录');
        return;
      }

      // 步骤3：处理每条记录
      const processedResults = [];
      for (let i = 0; i < computers.length; i++) {
        const computer = computers[i];
        const result = { barcode: computer.barcode, status: 'pending' };

        try {
          // 在Excel中查找匹配
          const excelRow = excelData.find(row => row[2] === computer.barcode);
          if (!excelRow || !excelRow[4]) {
            result.status = 'warning';
            result.message = '未找到匹配的型号';
            processedResults.push(result);
            continue;
          }

          // 获取新型号和市场名称
          const newModel = excelRow[4];
          const newMarketName = await getMarketName(newModel);

          // 更新数据库
          const { error: updateError } = await supabase
            .from('computers')
            .update({
              model: newModel,
              marketname: newMarketName || '未知市场名称'
            })
            .eq('barcode', computer.barcode);

          if (updateError) throw updateError;

          result.status = 'success';
          result.message = `成功更新：型号 ${newModel}，市场名称 ${newMarketName || '未知'}`;
          result.newModel = newModel;
          result.newMarketName = newMarketName;

        } catch (err) {
          result.status = 'error';
          result.message = `处理失败: ${err.message}`;
        }

        processedResults.push(result);
        setProgress((i + 1) / computers.length * 100);
        setResults([...processedResults]);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        型号匹配工具
        <Typography variant="subtitle1" color="text.secondary">
          当前待处理记录：{results.length}条
        </Typography>
      </Typography>

      {/* 控制面板 */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          onClick={handleMatch}
          disabled={loading}
          sx={{ width: 200 }}
        >
          {loading ? '处理中...' : '开始匹配'}
        </Button>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              进度：{Math.round(progress)}%
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* 结果展示 */}
      {results.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>条码</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>新型号</TableCell>
                <TableCell>新市场名称</TableCell>
                <TableCell>详细信息</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.barcode}</TableCell>
                  <TableCell>
                    <Chip
                      label={result.status}
                      color={
                        result.status === 'success' ? 'success' :
                        result.status === 'error' ? 'error' : 'warning'
                      }
                      icon={
                        result.status === 'success' ? <CheckCircle /> :
                        result.status === 'error' ? <Error /> : <Info />
                      }
                    />
                  </TableCell>
                  <TableCell>{result.newModel || '-'}</TableCell>
                  <TableCell>{result.newMarketName || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 400 }}>
                    <Typography variant="body2" color="text.secondary">
                      {result.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ModelMatchPage;