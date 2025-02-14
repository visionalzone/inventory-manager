import { useState } from 'react'
import { supabase } from '../supabaseClient'

const AddPage = () => {
  const [form, setForm] = useState({
    barcode: '',
    model: '',
    marketname: '',
    store: 'A区', // 默认值
    column: 1,
    level: 1
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('computers').insert([form])
    alert(error ? '保存失败' : '保存成功')
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <div>
        <label>条码：</label>
        <input 
          value={form.barcode}
          onChange={e => setForm({...form, barcode: e.target.value})}
          required
        />
      </div>
      {/* 其他字段类似 */}
      <button type="submit">提交</button>
    </form>
  )
}