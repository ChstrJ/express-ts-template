import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';

const seedLevel = async (n: number = 4) => {
  for (let i = 1; i <= n; i++) {
    const data = {
      commission_level_id: IdGenerator.generateUUID(),
      commission_level: i,
      commission_percentage: mapLevel(i),
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.insertInto('commission_level').values(data).execute();
  }

  console.log('Done creating levels');
};

const data: Record<number, number> = {
  1: 5.0,
  2: 4.0,
  3: 3.0,
  4: 2.0,
  5: 1.0
};

const mapLevel = (n: number) => {
  return data[n];
};

seedLevel(5).then(() => {
  process.exit(1);
});
