import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { Status } from '@common/constants/status';
import { generateDateNow } from '@utils/helpers';

const ranks = [
    { name: 'bronze', gv: 1000, pv: 100, active_legs: 2, leg_cap: 70, depth: 1 },
    { name: 'silver', gv: 3000, pv: 150, active_legs: 2, leg_cap: 60, depth: 2 },
    { name: 'gold', gv: 7500, pv: 200, active_legs: 3, leg_cap: 50, depth: 3 },
    { name: 'platinum', gv: 15000, pv: 250, active_legs: 4, leg_cap: 40, depth: 4 },
    { name: 'diamond', gv: 40000, pv: 300, active_legs: 4, leg_cap: 35, depth: 5 }
];

const createMinSettings = async () => {
    const data = {
        app_settings_id: IdGenerator.generateUUID(),
        key: 'min_withdraw_amount',
        value: String(200),
        created_at: generateDateNow(),
        updated_at: generateDateNow()
    };

    await db.insertInto('app_settings').values(data).execute();
}

const maxCashoutPerDay = async () => {
    const data = {
        app_settings_id: IdGenerator.generateUUID(),
        key: 'max_cashout_per_day',
        value: String(5),
        created_at: generateDateNow(),
        updated_at: generateDateNow()
    };

    await db.insertInto('app_settings').values(data).execute();
}

const seedRanks = async () => {
    console.log(`Creating ${ranks.length} ranks...`);

    for (const rank of ranks) {
        const data = {
            ranks_id: IdGenerator.generateUUID(),
            name: rank.name,
            gv_req: String(rank.gv),
            pv_req: String(rank.pv),
            active_legs: rank.active_legs,
            leg_cap: String(rank.leg_cap),
            created_at: new Date(),
            updated_at: new Date()
        };

        try {
            await db.insertInto('ranks').values(data).execute();
        } catch (error) {
            console.log(error);
            console.log(`Error creating rank ${rank.name}`, error);
        }
    }

    console.log('Done creating ranks...');
};

seedRanks()
    .then(createMinSettings)
    .then(maxCashoutPerDay)
    .then(() => {
        process.exit(1);
    })

