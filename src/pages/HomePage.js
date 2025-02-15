import React from 'react';
import { Typography, Container } from '@mui/material';

const HomePage = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        欢迎使用库存管理系统
      </Typography>
      <Typography variant="body1">
        请使用导航栏进行查询或添加记录。
      </Typography>
    </Container>
  );
};

export default HomePage;