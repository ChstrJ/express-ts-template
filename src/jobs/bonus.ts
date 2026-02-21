import { BaseJob } from "./base";
import { Job, JobType } from "@common/constants/job";
import { commissionService } from "@features/commission/commission.service";
import { criticalQueue } from "src/queues/critical";
import { teamService } from "@features/team/team.service";
import { getLastMonthRange } from "@utils/date";
import { RankType } from "@utils/types";


export class BonusJob extends BaseJob {
    protected static jobName: string = Job.BONUS;
    protected static queue = criticalQueue;
    protected static attempts: number = 1;

    public static async handle(data: any) {
        const { startOfLastMonth, endOfLastMonth } = getLastMonthRange();
        const ranks = await teamService.getRanks();
        const payload = data.payload;

        switch (data.type) {
            case JobType.BONUS:
                await teamService.snapshotMonthlyRanks(ranks, startOfLastMonth, endOfLastMonth);
                await commissionService.releaseBonus(ranks as RankType[], startOfLastMonth, endOfLastMonth);
                break;
            case JobType.PROCESS_GOLD:
                await commissionService.processGoldBonus(
                    payload.accounts,
                    payload.ranks,
                    payload.startDate,
                    payload.endDate
                );
                break;
            case JobType.PROCESS_PLATINUM:
                await commissionService.processPlatinumBonus(
                    payload.accounts,
                    payload.ranks,
                    payload.startDate,
                    payload.endDate
                );
                break;
            case JobType.PROCESS_DIAMOND:
                await commissionService.processDiamondBonus(
                    payload.accounts,
                    payload.ranks,
                    payload.startDate,
                    payload.endDate
                );
                break;
            default:
                return false;
        }
    }
}
