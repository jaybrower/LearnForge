import { handleRequest } from './middleware';
import { ExpandedRequest } from './requestTypes';

const server = Bun.serve({
    port: 3000,
    fetch: async (req: Request) => await handleRequest(new ExpandedRequest(req)),
});

console.log(`Listening on port ${server.port}`);

import './apis';