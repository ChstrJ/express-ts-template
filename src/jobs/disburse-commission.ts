import { defaultQueue } from "src/queues/default";
import { criticalQueue } from "src/queues/critical";
import { BaseJob } from "./base";

export class DisburseCommissionJob extends BaseJob {
    protected static jobName = 'disburse_commission';
    protected static queue = criticalQueue;
    
    public static async handle(data: any) {
    }
}