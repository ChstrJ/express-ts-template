import { BaseJob } from "./base";
import { Job, JobType } from "@common/constants/job";
import { commissionService } from "@features/commission/commission.service";
import { criticalQueue } from "src/queues/critical";
import { teamService } from "@features/team/team.service";
import { getCurrentMonthRange } from "@utils/date";
import { RankType } from "@utils/types";

export class CommissionJob extends BaseJob {
    protected static jobName: string = Job.COMMISSION;
    protected static queue = criticalQueue;
    protected static attempts: number = 1;

    public static async handle(data: any) {
        const ranks = await teamService.getRanks();
        const { startOfMonth, endOfMonth } = getCurrentMonthRange();

        switch (data.type) {
            case JobType.ON_HOLD_COMMISSION:
                await teamService.snapshotRanks(ranks, startOfMonth, endOfMonth);
                await commissionService.releaseOnHoldCommissions(ranks as RankType[], startOfMonth, endOfMonth);

                return true;
            default:
                return;
        }
    }
}