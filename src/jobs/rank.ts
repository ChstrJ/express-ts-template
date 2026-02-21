import { BaseJob } from "./base";
import { Job, JobType } from "@common/constants/job";
import { teamService } from "@features/team/team.service";
import { criticalQueue } from "src/queues/critical";

export class RankJob extends BaseJob {
    protected static jobName: string = Job.RANK;
    protected static queue = criticalQueue;
    protected static attempts: number = 3;

    public static async handle(data: any) {
        switch (data.type) {
            
            default:
                return;
        }
    }
}