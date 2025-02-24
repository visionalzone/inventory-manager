import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const menuItems = [
  {
    title: '型号匹配',
    path: '/model-match',
    icon: <AutoFixHighIcon />
  }
];

const Navigation = () => {
  const navigate = useNavigate();
  const [warehouseAnchor, setWarehouseAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  const handleWarehouseClick = (event) => {
    setWarehouseAnchor(event.currentTarget);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setWarehouseAnchor(null);
    setSettingsAnchor(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ color: '#1976d2', flexGrow: 0, marginRight: 4 }}>
          库存管理系统
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ color: '#555' }}
          >
            首页
          </Button>
          
          <Button 
            color="inherit" 
            onClick={() => navigate('/records')}
            sx={{ color: '#555' }}
          >
            查询记录
          </Button>
          
          <Button 
            color="inherit"
            onClick={handleWarehouseClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ color: '#555' }}
          >
            仓库
          </Button>
          <Menu
            anchorEl={warehouseAnchor}
            open={Boolean(warehouseAnchor)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => { navigate('/location'); handleClose(); }}>
              库位管理
            </MenuItem>
            <MenuItem onClick={() => { navigate('/add-record'); handleClose(); }}>
              添加记录
            </MenuItem>
            <MenuItem onClick={() => { navigate('/batch-add'); handleClose(); }}>
              批量添加记录
            </MenuItem>
            <MenuItem onClick={() => { navigate('/model-match'); handleClose(); }}>
              型号匹配
            </MenuItem>
          </Menu>
          
          <Button 
            color="inherit"
            onClick={handleSettingsClick}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ color: '#555' }}
          >
            系统设置
          </Button>
          <Menu
            anchorEl={settingsAnchor}
            open={Boolean(settingsAnchor)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => { navigate('/model-management'); handleClose(); }}>
              型号管理
            </MenuItem>
            <MenuItem onClick={() => { navigate('/warehouse-init'); handleClose(); }}>
              仓库初始化
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;