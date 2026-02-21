import { defaultQueue } from "src/queues/default";

export const clearQueue = async () => {
    try {
        await defaultQueue.drain(true);

        await defaultQueue.close();
    } catch (error) {
        console.error(`Error clearing the queue:`, error);
    }

    console.log('Queue cleared successfully.');
};

clearQueue().then(() => process.exit(1));
