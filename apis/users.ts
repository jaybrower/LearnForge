import { registerGetEndpoint, requireAuthentication } from '../middleware';
import { ExpandedRequest } from '../requestTypes';
import { notFound } from '../responses';

registerGetEndpoint('api/v1.0/users/$userId', requireAuthentication((req: ExpandedRequest): Response => {
    const userId = req.getParam('userId');
    if (userId === 'me') {
        return new Response(JSON.stringify(req.user));
    }

    return notFound();
}));