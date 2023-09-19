import { ExpandedRequest, RequestFunction, IEndpointOptions } from './requestTypes';
import { notFound, notAuthorized } from './responses';
import jwt from 'jsonwebtoken';

const endpoints: any[][] = [];

/**
 * Direct the given request to the registered endpoint that matches
 * based on the path and HTTP method.
 * @param req The expanded request to map which will also be passed to the matched endpoint.
 * @returns 404 if no matching endpoint is registered, or the response from the endpoint.
 */
export const handleRequest: RequestFunction = async (req: ExpandedRequest) => {
    const path = req.url.pathname.slice(1);

    console.log(`Handling request: Path → "${path}"; Method → "${req.method}"`);

    const endpoint = endpoints.find(ep =>
        path.match(ep[0].pathExp) &&
        ep[0].methods.includes(req.method)
    );
    if (!endpoint || endpoint.length !== 2 || typeof endpoint[1] !== 'function') {
        return notFound();
    }

    const endpointParts = endpoint[0].path.split(/[\\\/]/gi);
    const pathParts = path.split(/[\\\/]/gi);

    const params: any = {};
    for (let i = 0; i < endpointParts.length; i++) {
        const endpointPart = endpointParts[i];
        if (endpointPart.startsWith('$')) {
            params[endpointPart.slice(1)] = pathParts[i];
        }
    }

    console.log(`Request params: ${JSON.stringify(params)}`);

    return await endpoint[1](new ExpandedRequest(req.getRequest(), params));
};

/**
 * Register an endpoint with the request handler.
 * @param options Options to register the endpoint with.
 * @param handler Method that will take the request and return a response.
 */
const registerEndpoint = (options: IEndpointOptions, handler: RequestFunction) => {
    endpoints.push([options, handler]);
};

/**
 * Generate a path RegExp based on a path string.
 * @param path Path to register for the endpoint including params.
 * @returns RegExp that can be used to match against the request path.
 */
const generatePathRegExp = (path: string) => new RegExp(
    '^(' + path
        .replace(/[\/\\]/gi, '[\\\/]')
        .replace(/\./gi, '\\.')
        .replace(/\$userId/gi, '(\\bme|\\d+)')
        .replace(/\$[a-z0-9]+/gi, '[a-z0-9]+') + ')$',
    'i'
);

/**
 * Register an endpoint with the given HTTP method.
 * @param method HTTP method to match against the request.
 * @param path RegExp path to match against the request path.
 * @param handler Method that will take the request and return a response.
 */
export const registerEndpointWithMethod = (method: string, path: string, handler: RequestFunction) => {
    registerEndpoint({
        methods: [method],
        path,
        pathExp: generatePathRegExp(path),
    } as IEndpointOptions, handler);
};

/**
 * Register a GET method endpoint.
 * @param path RegExp path to match against the request path.
 * @param handler Method that will take the request and return a response.
 */
export const registerGetEndpoint = (path: string, handler: RequestFunction) =>
    registerEndpointWithMethod('GET', path, handler);

/**
 * Register a POST method endpoint.
 * @param path RegExp path to match against the request path.
 * @param handler Method that will take the request and return a response.
 */
export const registerPostEndpoint = (path: string, handler: RequestFunction) =>
    registerEndpointWithMethod('POST', path, handler);

/**
 * Register a PUT method endpoint.
 * @param path RegExp path to match against the request path.
 * @param handler Method that will take the request and return a response.
 */
export const registerPutEndpoint = (path: string, handler: RequestFunction) =>
    registerEndpointWithMethod('PUT', path, handler);

/**
 * Configure the given endpoint to require authentication.
 * @param next Handler for the request if authenticated.
 * @returns 401 if not authorized, or the response from the handler.
 */
export const requireAuthentication = (next: RequestFunction): RequestFunction => async (req: ExpandedRequest) => {
    const authToken = req.getAuthToken();
    if (!authToken) {
        return notAuthorized();
    }

    const publicKey = await Bun.file(Bun.env.LF_PATH_TO_JWT_PUB_KEY as string).text();
    let decoded: any;
    try {
        decoded = jwt.verify(authToken, publicKey, { algorithms: ['RS256'] });
    } catch (err) {


        console.log('err:', err);


        // TODO: Log the error.
        return notAuthorized();
    }


    console.log('decoded:', decoded);


    return await next(req);
};