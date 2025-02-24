const { ipcMain } = require('electron');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

console.log('Loading modelHandlers...');

// Initialize Supabase
const supabase = createClient(
  'https://atvvplxpjgcdakwedjdd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnZwbHhwamdjZGFrd2VkamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDY3NTYsImV4cCI6MjA1NTEyMjc1Nn0.gwP0KAyG3QihU88HVrslFH7SE0aiNyHogR2JYjESHRI'
);

// Register handlers directly
ipcMain.handle('get-all-barcodes', async (event) => {
  try {
    console.log('接收到获取所有条码的请求');
    
    // 更新为正确的Excel文件路径
    const excelPath = 'C:/Users/Kevin/Documents/inventory-manager/public/model.xlsx';
    
    console.log('正在查找Excel文件:', excelPath);
    
    if (!fs.existsSync(excelPath)) {
      console.error('Excel文件不存在，路径:', excelPath);
      // 尝试列出目录内容
      const dirPath = path.dirname(excelPath);
      if (fs.existsSync(dirPath)) {
        console.log('目录内容:', fs.readdirSync(dirPath));
      } else {
        console.log('目录不存在:', dirPath);
      }
      throw new Error(`找不到Excel文件: ${excelPath}`);
    }

    console.log('找到Excel文件，正在读取...');
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('成功读取Excel数据，记录数:', data.length);
    if (data.length > 0) {
      console.log('第一条记录示例:', data[0]);
    }

    return data.map(row => ({
      barcode: row.Barcode,
      rowData: row
    }));
  } catch (error) {
    console.error('获取条码列表出错:', error);
    throw error;
  }
});

ipcMain.handle('find-model-by-barcode', async (event, barcode) => {
  try {
    const excelPath = 'C:/Users/Kevin/Documents/inventory-manager/public/model.xlsx';
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const record = data.find(row => row.Barcode === barcode);
    
    if (record) {
      console.log('找到 Excel 记录:', record);
      
      // 从 model_market_names 表查询
      const { data: marketData, error: marketError } = await supabase
        .from('model_market_names')
        .select('model, market_name')  // 使用正确的字段名 market_name
        .eq('model', record.Model.trim())
        .single();

      if (marketError) {
        console.error('查询机型信息失败:', marketError);
      }

      console.log('数据库查询结果:', marketData);

      const result = {
        Barcode: record.Barcode,
        'ERP#': record.Model,
        MarketName: marketData?.market_name || '无'  // 使用 market_name 字段
      };
      
      console.log('返回的完整结果:', result);
      return result;
    }

    return null;
  } catch (error) {
    console.error('查找过程出错:', error);
    throw error;
  }
});

ipcMain.handle('update-model-data', async (event, { barcode }) => {
  try {
    console.log('开始处理数据更新请求:', barcode);
    const excelPath = 'C:/Users/Kevin/Documents/inventory-manager/public/model.xlsx';
    
    // 读取 Excel
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const record = data.find(row => row.Barcode === barcode);
    if (!record) {
      throw new Error(`找不到条码 ${barcode} 的匹配记录`);
    }

    // 检查必要字段
    if (!record.Model) {
      throw new Error('Excel记录中缺少Model字段');
    }

    // 从数据库查找机型信息
    const { data: marketData, error: marketError } = await supabase
      .from('model_market_names')
      .select('model, market_name')  // 使用正确的字段名
      .eq('model', record.Model.trim())
      .single();

    if (marketError) {
      console.error('查询机型信息失败:', marketError);
    }

    // 准备更新数据
    const updateData = {
      model: record.Model,
      marketname: marketData?.market_name || null  // 使用查询到的 market_name
    };

    console.log('准备更新到数据库:', updateData);

    // 更新 computers 表
    const { data: updateResult, error: updateError } = await supabase
      .from('computers')
      .update(updateData)
      .eq('barcode', barcode)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('数据库更新成功:', updateResult);
    return {
      success: true,
      updatedRecord: updateResult
    };

  } catch (error) {
    console.error('更新失败:', error);
    throw new Error(`更新失败: ${error.message}`);
  }
});

console.log('All handlers registered');
