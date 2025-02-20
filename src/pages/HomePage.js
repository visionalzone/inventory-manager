import React from 'react';
import { Typography, Container, Grid } from '@mui/material';
import WorldClock from '../components/WorldClock';

const HomePage = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        欢迎使用库存管理系统
      </Typography>
      <Grid container spacing={4} sx={{ my: 2 }}>
        <Grid item xs={12} md={6}>
          <WorldClock city="Beijing" />
        </Grid>
        <Grid item xs={12} md={6}>
          <WorldClock city="Toronto" />
        </Grid>
      </Grid>
      <Typography variant="body1">
        请使用导航栏进行查询或添加记录。
      </Typography>
    </Container>
  );
};

export default HomePage;