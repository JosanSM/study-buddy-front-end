import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarDayCell } from './CalendarDayCell';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Returns a YYYY-MM-DD string for a Date without any timezone conversion.
// Using toLocaleDateString or toISOString can shift the date when the local
// timezone is behind UTC, so we build the string manually.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns an array of Date objects representing the full Mon–Sun grid for the
// given month. Leading/trailing days from adjacent months fill incomplete weeks.
function buildWeeks(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // getDay() returns 0=Sun, so we convert to Mon=0 index
  const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalDays = firstDayOfWeek + daysInMonth;
  const totalCells = Math.ceil(totalDays / 7) * 7;

  const days = [];
  for (let i = 0; i < totalCells; i++) {
    const offset = i - firstDayOfWeek;
    days.push(new Date(year, month, 1 + offset));
  }

  // Split flat days array into arrays of 7 (weeks)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function CalendarGrid({ year, month, topicsByDate, onTopicClick }) {
  const todayKey = toDateKey(new Date());

  // Collect all overdue topics (nextReviewAt is in the past) so they can be
  // pinned to today's cell alongside topics due today.
  const overdueTopics = useMemo(() => {
    const result = [];
    topicsByDate.forEach((topics, dateKey) => {
      if (dateKey < todayKey) {
        topics.forEach((t) => result.push({ ...t, _isOverdue: true }));
      }
    });
    return result;
  }, [topicsByDate, todayKey]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  return (
    <Box>
      {/* Day-of-week column headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_HEADERS.map((day) => (
          <Typography
            key={day}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              py: 0.75,
              borderRight: '1px solid',
              borderBottom: '1px solid',
              borderTop: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:first-of-type': { borderLeft: '1px solid', borderColor: 'divider' },
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar weeks */}
      {weeks.map((week, weekIdx) => (
        <Box
          key={weekIdx}
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
        >
          {week.map((date, dayIdx) => {
            const dateKey = toDateKey(date);
            const isToday = dateKey === todayKey;
            const isCurrentMonth = date.getMonth() === month;

            // For today's cell, merge topics due today with all overdue topics.
            // Overdue topics are not shown on their original past dates to avoid
            // cluttering days the user can no longer act on.
            let cellTopics;
            if (isToday) {
              const todayTopics = (topicsByDate.get(dateKey) ?? []).map((t) => ({
                ...t,
                _isOverdue: false,
              }));
              cellTopics = [...todayTopics, ...overdueTopics];
            } else if (dateKey < todayKey) {
              // Past cells show nothing — overdue topics are pinned to today
              cellTopics = [];
            } else {
              cellTopics = (topicsByDate.get(dateKey) ?? []).map((t) => ({
                ...t,
                _isOverdue: false,
              }));
            }

            return (
              <CalendarDayCell
                key={dateKey}
                date={date}
                topics={cellTopics}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                onTopicClick={onTopicClick}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
