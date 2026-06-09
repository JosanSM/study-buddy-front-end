import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SideNav from '../navigation/SideNav';

export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav />
      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'grey.50' }}>
        <Outlet />
      </Box>
    </Box>
  );
}