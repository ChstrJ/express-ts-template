import { accountActivityRepository } from './account-activity.repository';
import { QueryParams } from '@utils/pagination';

export const accountActivityService = {
  async getAccountActivities(q: QueryParams) {
    return await accountActivityRepository.getAccountActivities(q);
  }
};
