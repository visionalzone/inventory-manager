import { saveAs } from 'file-saver';
import { supabase } from './supabaseClient';

const ExportButton = () => {
  const handleExport = async () => {
    const { data, error } = await supabase
      .from('computers')
      .select('barcode,model,marketname,location_store,location_column,location_level');

    if (error) return alert('导出失败');
    
    const csvHeader = '条码,型号,市场名称,仓库,列,层\n';
    const csvContent = data.map(item => 
      `${item.barcode},${item.model},${item.marketname},${item.location_store},${item.location_column},${item.location_level}`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `库存数据_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return <button onClick={handleExport}>导出CSV</button>;
};