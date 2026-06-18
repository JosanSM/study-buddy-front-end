import { Box, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export const NAV_WIDTH = 180;

const NAV_ITEMS = [
  { label: 'home', path: null },
  { label: 'calendar', path: '/calendar' },
  { label: 'topic list', path: '/topics' },
];

export default function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      component="nav"
      sx={{
        width: NAV_WIDTH,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: '100vh',
      }}
    >
      <List disablePadding>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={!!item.path && location.pathname === item.path}
              onClick={() => { if (item.path) navigate(item.path); }}
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}