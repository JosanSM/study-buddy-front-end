import { NAV_WIDTH } from '../navigation/SideNav';

// Shared dialog positioning for the slide-in panel — used by TopicsPage and CalendarPage.
// Positions the dialog to start just to the right of the sidebar, filling the remaining viewport.
export const PANEL_DIALOG_SX = {
  '& .MuiDialog-container': {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  '& .MuiDialog-paper': {
    m: 0,
    mt: '2vh',
    ml: { xs: '2vw', sm: `${NAV_WIDTH + 10}px` },
    width: {
      xs: 'calc(100vw - 4vw)',
      sm: `calc(100vw - ${NAV_WIDTH + 10}px - 1.5vw)`,
    },
    height: '96vh',
    maxWidth: 'none',
    maxHeight: 'none',
  },
};
