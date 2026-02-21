import { commissionService } from '@features/commission/commission.service';
import logger from '@utils/logger';
import 'dotenv/config';

async function main() {
    try {
        logger.info('Starting commission disbursement job...');

        const result = await commissionService.disburseUnreleasedCommission();

        logger.info(`Disbursement finished: ${result}`);
        process.exit(0);
    } catch (err) {
        logger.error('Error running disbursement job', err);
        process.exit(1);
    }
}

main();
