import { IInvalidRequestBody } from './responseModels';

export const notAuthorized = () => new Response(null, {
    status: 401,
    statusText: 'Not Authorized',
} as ResponseInit);

export const notFound = () => new Response(null, {
    status: 404,
    statusText: 'Not Found',
});

export const invalidRequestBody = (response: IInvalidRequestBody) => new Response(JSON.stringify(response), {
    headers: {
        'Content-Type': 'application/json',
    },
    status: 400,
    statusText: 'Bad Request',
});