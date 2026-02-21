import dayjs from 'dayjs';
import { QueryParams } from './pagination';

export const getLastMonthRange = () => {
  const startOfLastMonth = dayjs().subtract(1, 'month').startOf('month').toDate();
  const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month').toDate();

  return { startOfLastMonth, endOfLastMonth };
};

export const getCurrentMonthRange = () => {
  const startOfMonth = dayjs().startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();

  return { startOfMonth, endOfMonth };
};

export const getSixMonthsAgo = () => {
  const startOfMonth = dayjs().subtract(6, 'month').startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();

  return { startOfMonth, endOfMonth };
};

export const getMonthRange = (month: number) => {
  const index = month - 1; // Adjust for zero-based index
  const startOfMonth = dayjs().month(index).startOf('month').toDate();
  const endOfMonth = dayjs().month(index).endOf('month').toDate();

  return { startOfMonth, endOfMonth };
};

export const getCurrentDayRange = () => {
  const startOfDay = dayjs().startOf('day').toDate();
  const endOfDay = dayjs().endOf('day').toDate();

  return { startOfDay, endOfDay };
};

export const formatMonth = (q: QueryParams) => {
  if (q.start_date && q.end_date) {
    const startDate = dayjs(q.start_date).format('MMMM DD, YYYY');
    const endDate = dayjs(q.end_date).format('MMMM DD, YYYY');

    return `${startDate} - ${endDate}`;
  }

  return null;
}

export const getLastWeekRange = () => {
  const now = dayjs();

  // Last week's Monday 12AM
  const start = now.subtract(1, 'week').startOf('week').add(1, 'day')

  // Last week's Sunday 11:59:59 PM
  const end = start.add(6, 'day').endOf('day')

  const startOfLastWeek = start.toDate();
  const endOfLastWeek = end.toDate();

  return { startOfLastWeek, endOfLastWeek };
}

export const getCurrentFormattedDate = () => {
  return dayjs().format("MMMM, DD, YYYY")
}

export function getCutoffRange(now = dayjs()) {
  const day = now.date();
  const currentMonth = now.startOf('month');
  const prevMonth = now.subtract(1, 'month');

  if (day === 8) {
    // 22nd of previous month to 7th of current month cutoff
    return {
      start: prevMonth.date(22).startOf('day').toDate(),
      end: currentMonth.date(7).endOf('day').toDate(),
    };
  }

  if (day === 22) {
    // 8–21 cutoff
    return {
      start: currentMonth.date(8).startOf('day').toDate(),
      end: currentMonth.date(21).endOf('day').toDate(),
    };
  }
}