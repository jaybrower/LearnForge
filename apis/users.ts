import { registerGetEndpoint, registerPostEndpoint, requireAuthentication } from '../middleware';
import { ExpandedRequest } from '../requestTypes';
import { notFound } from '../responses';
import jwt from 'jsonwebtoken';

registerGetEndpoint('api/v1.0/users/$userId', requireAuthentication(async (req: ExpandedRequest): Promise<Response> => {
    const userId = req.getParam('userId');
    if (userId === 'me') {
        return new Response(JSON.stringify(req.user));
    }

    return notFound();
}));

registerPostEndpoint('api/v1.0/users/auth', async (req: ExpandedRequest): Promise<Response> => {
    const body = await req.getJsonBodyAsync();

    // TODO:    Query the DB for the user and use Bun's built in hash
    //          logic to verify the passowrd. If the password matches
    //          we will return the user details, otherwise return a
    //          403. https://bun.sh/guides/util/hash-a-password


    console.log('body:', body);
    console.log('Bun.env.LF_PATH_TO_JWT_SIGN_KEY:', Bun.env.LF_PATH_TO_JWT_SIGN_KEY);


    const privateKey = await Bun.file(Bun.env.LF_PATH_TO_JWT_SIGN_KEY as string).text();
    const token = jwt.sign(body, privateKey, { expiresIn: '1h' });


    console.log('token:', token);


    return new Response(JSON.stringify({
        ...body,
        token
    }));
});