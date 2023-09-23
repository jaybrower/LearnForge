import { registerGetEndpoint, registerPostEndpoint, requireAuthentication } from '../middleware';
import { ExpandedRequest } from '../requestTypes';
import { notFound, invalidRequestBody, okJson, serverError, conflict } from '../responses';
import { IInvalidRequestBody, IAuthUser } from '../responseModels';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import { IUser } from '../entities';

registerGetEndpoint('api/v1.0/users/$userId', requireAuthentication(async (req: ExpandedRequest): Promise<Response> => {
    let userId = req.getParam('userId');
    if (userId === 'me') {
        userId = req.user?._id.toString();
    }

    // TODO: A permission check to make sure you can view the user.

    const client = new MongoClient(Bun.env.LF_MONGODB_URL as string);
    await client.connect();

    const db = client.db(Bun.env.LF_MONGODB_DATABASE as string);
    const collection = db.collection<IUser>('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
        return notFound();
    }

    return okJson({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isDeleted: user.isDeleted,
        isVerified: user.isVerified,
        createdDate: user.createdDate,
    });
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

    const existingUser = await collection.findOne({ email: body.email, isDeleted: false });
    if (existingUser) {
        return conflict('A user with the given email already exists.');
    }

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
        return serverError('Failed to create user account.');
    }

    return okJson({
        _id: result.insertedId
    });
});

registerPostEndpoint('api/v1.0/users/auth', async (req: ExpandedRequest): Promise<Response> => {
    const body = await req.getJsonBodyAsync();

    const client = new MongoClient(Bun.env.LF_MONGODB_URL as string);
    await client.connect();

    const db = client.db(Bun.env.LF_MONGODB_DATABASE as string);
    const collection = db.collection<IUser>('users');

    const user = await collection.findOne({ email: body.email, isDeleted: false });
    if (!user) {
        return notFound();
    }

    const doesPasswordMatch = await Bun.password.verify(body.password, user.passwordHash);
    if (!doesPasswordMatch) {
        return invalidRequestBody({
            properties: [
                {
                    name: 'password',
                    message: 'Given password is invalid.',
                    isRequired: true,
                },
            ],
        });
    }

    const responseUser: IAuthUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    };
    const token = jwt.sign(responseUser, Bun.env.LF_JWT_SIGNING_KEY as string, { expiresIn: '1h' });

    return okJson({
        ...responseUser,
        token
    });
});