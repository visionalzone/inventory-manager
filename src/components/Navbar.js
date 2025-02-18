import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          库存管理系统
        </Typography>
        <Button color="inherit" component={Link} to="/">
          首页
        </Button>
        <Button color="inherit" component={Link} to="/scan">
          查询记录
        </Button>
        <Button color="inherit" component={Link} to="/add">
          添加记录
        </Button>
        <Button color="inherit" component={Link} to="/location">
          库位管理
        </Button>
        <Button color="inherit" component={Link} to="/batch-add">
          批量增加记录
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;