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

export const getCurrentFormattedDate = () => {
  return dayjs().format("MMMM, DD, YYYY")
}