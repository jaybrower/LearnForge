import { MongoClient, Db } from 'mongodb';

export const connectAsync = async (): Promise<Db> => {
    const client = new MongoClient(Bun.env.LF_MONGODB_URL as string);
    await client.connect();

    return client.db(Bun.env.LF_MONGODB_DATABASE as string);
}