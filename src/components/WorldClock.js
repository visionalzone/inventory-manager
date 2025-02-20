import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box } from '@mui/material';
// 导入地图图片
import chinaMap from '../assets/images/china-map.png';
import canadaMap from '../assets/images/canada-map.png';

const WorldClock = ({ city }) => {
  const [time, setTime] = useState(new Date());

  const cityInfo = {
    'Beijing': {
      name: '北京',
      map: chinaMap,
      timezone: 'Asia/Shanghai'
    },
    'Toronto': {
      name: '多伦多',
      map: canadaMap,
      timezone: 'America/Toronto'
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const cityTime = new Date(new Date().toLocaleString('en-US', { 
        timeZone: cityInfo[city].timezone 
      }));
      setTime(cityTime);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [city]);

  return (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
      <Box sx={{ 
        mb: 2, 
        height: 150, // 固定高度的容器
        display: 'flex',
        alignItems: 'center',  // 改为中间对齐
        justifyContent: 'center'
      }}>
        <img 
          src={cityInfo[city].map} 
          alt={`${cityInfo[city].name}地图`}
          style={{
            maxWidth: '200px',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {cityInfo[city].name}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">
          {time.toLocaleDateString('zh-CN', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {time.toLocaleTimeString('zh-CN')}
        </Typography>
      </Box>
    </Paper>
  );
};

export default WorldClock;
