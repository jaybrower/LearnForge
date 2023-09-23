import { registerGetEndpoint, registerPostEndpoint, requireAuthentication } from '../middleware';
import { ExpandedRequest } from '../requestTypes';
import { notFound, invalidRequestBody } from '../responses';
import { IInvalidRequestBody } from '../responseModels';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { IUser } from '../entities';

registerGetEndpoint('api/v1.0/users/$userId', requireAuthentication(async (req: ExpandedRequest): Promise<Response> => {
    const userId = req.getParam('userId');
    if (userId === 'me') {
        return new Response(JSON.stringify(req.user));
    }

    return notFound();
}));

registerPostEndpoint('api/v1.0/users/register', async (req: ExpandedRequest): Promise<Response> => {
    const body = await req.getJsonBodyAsync();

    const emailExpression = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!body.email || !body.verifyEmail || body.email !== body.verifyEmail || !emailExpression.test(body.email)) {
        return invalidRequestBody({
            properties: [
                {
                    name: 'email',
                    message: 'Make sure a valid email is provided and the email and verify email match.',
                    isRequired: true,
                },
            ],
        } as IInvalidRequestBody);
    }

    if (!body.password || !body.verifyPassword || body.password !== body.verifyPassword) {
        return invalidRequestBody({
            properties: [
                {
                    name: 'password',
                    message: 'Make sure a password is provided and the password and verify password match.',
                    isRequired: true,
                },
            ],
        } as IInvalidRequestBody);
    }

    if (!body.firstName) {
        return invalidRequestBody({
            properties: [
                {
                    name: 'firstName',
                    message: 'Make sure a first name is provided.',
                    isRequired: true,
                },
            ],
        } as IInvalidRequestBody);
    }

    if (!body.lastName) {
        return invalidRequestBody({
            properties: [
                {
                    name: 'lastName',
                    message: 'Make sure a last name is provided.',
                    isRequired: true,
                },
            ],
        } as IInvalidRequestBody);
    }

    // TODO: Check to make sure the given password is secure enough.

    const client = new MongoClient(Bun.env.LF_MONGODB_URL as string);
    await client.connect();

    const db = client.db(Bun.env.LF_MONGODB_DATABASE as string);
    const collection = db.collection<IUser>('users');

    const passwordHash = await Bun.password.hash(body.password);

    const result = await collection.insertOne({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        passwordHash: passwordHash,
        isDeleted: false,
        isVerified: false,
        createdDate: new Date(new Date().toUTCString()),
    });

    if (!result.acknowledged) {
        throw new Error('Failed to create user account.');
    }

    return new Response(JSON.stringify({
        id: result.insertedId
    }));
});

registerPostEndpoint('api/v1.0/users/auth', async (req: ExpandedRequest): Promise<Response> => {
    const body = await req.getJsonBodyAsync();

    const client = new MongoClient(Bun.env.LF_MONGODB_URL as string);
    await client.connect();

    const db = client.db(Bun.env.LF_MONGODB_DATABASE as string);
    const collection = db.collection<IUser>('users');

    const users = collection.find({ email: body.email, isDeleted: false });

    // TODO:    Query the DB for the user and use Bun's built in hash
    //          logic to verify the passowrd. If the password matches
    //          we will return the user details, otherwise return a
    //          403. https://bun.sh/guides/util/hash-a-password


    const token = jwt.sign(body, Bun.env.LF_JWT_SIGNING_KEY as string, { expiresIn: '1h' });

    return new Response(JSON.stringify({
        ...body,
        token
    }));
});