import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';

const ranks = [
  {
    name: 'bronze',
    gv: 1000,
    pv: 100,
    levels: 5,
  },
  {
    name: 'silver',
    gv: 3000,
    pv: 150,
    levels: 5,
  },
  {
    name: 'gold',
    gv: 7500,
    pv: 200,
    levels: 5,
  },
  {
    name: 'platinum',
    gv: 15000,
    pv: 250,
    levels: 5,
  },
  {
    name: 'diamond',
    gv: 40000,
    pv: 300,
    levels: 5,
  },
];

const seedRanks = async () => {
  console.log(`Creating ${ranks.length} ranks...`);

  for (const rank of ranks) {
    const levelRates = [];
    for (let i = 0; i < rank.levels; i++) {
      levelRates.push({
        level: i + 1,
        rate: Math.floor(Math.random() * 10) + 1,
      });
    }

    const data = {
      ranks_id: IdGenerator.generateUUID(),
      name: rank.name,
      gv_req: rank.gv,
      pv_req: rank.pv,
      meta: JSON.stringify(levelRates),
      created_at: new Date(),
      updated_at: new Date(),
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

seedRanks().then(() => {
  process.exit(0);
});
