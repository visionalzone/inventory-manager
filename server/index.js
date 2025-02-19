const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/update-model', async (req, res) => {
  const { barcode } = req.body;
  
  try {
    const browser = await puppeteer.launch({
      headless: false  // 设置为 false 可以看到浏览器操作过程
    });
    const page = await browser.newPage();

    // 登录页面
    await page.goto('https://jkarma.msi.com/anpro/default.aspx');
    
    // 等待登录表单加载
    await page.waitForSelector('#loginId');
    await page.waitForSelector('#password');
    
    // 输入登录信息
    await page.type('#loginId', 'kevinkuang');
    await page.type('#password', 'Oct31001');
    
    // 等待手动输入验证码并登录
    await page.waitForNavigation();

    // 访问产品页面
    await page.goto(`https://jkarma.msi.com/anpro/30205.aspx?spid=30205&sid=SWnsqOwR8blzvnu4NR&apid=302&barcode=${barcode}`);

    // 获取 ERP Number
    const erpNumber = await page.evaluate(() => {
      // 这里需要根据实际页面结构调整选择器
      const element = document.querySelector('#erpNumber');
      return element ? element.textContent.trim() : null;
    });

    await browser.close();

    if (erpNumber) {
      res.json({ model: erpNumber });
    } else {
      res.status(404).json({ error: '未找到型号信息' });
    }
  } catch (error) {
    console.error('爬取失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});