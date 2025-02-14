import { useState } from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'
import { supabase } from '../supabaseClient'

const ScanPage = () => {
  const [result, setResult] = useState(null)

  const handleScan = async (barcode) => {
    const { data } = await supabase
      .from('computers')
      .select('*')
      .eq('barcode', barcode)
      .single()
    
    setResult(data || { error: '未找到设备' })
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>扫描电脑条码</h1>
      <BarcodeScannerComponent
        onUpdate={(err, result) => result && handleScan(result.text)}
        facingMode="environment" // 使用后置摄像头
      />
      {result?.error ? (
        <p style={{ color: 'red' }}>{result.error}</p>
      ) : result && (
        <div>
          <h3>{result.model}</h3>
          <p>位置：{result.location_store}库 {result.location_column}列 {result.location_level}层</p>
        </div>
      )}
    </div>
  )
}