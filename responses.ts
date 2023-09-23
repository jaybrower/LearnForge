import { IInvalidRequestBody } from './responseModels';

export const okJson = (response: any) => new Response(JSON.stringify(response), {
    headers: {
        'Content-Type': 'application/json',
    },
    status: 200,
    statusText: 'OK',
});

export const notAuthorized = () => new Response(null, {
    status: 401,
    statusText: 'Not Authorized',
} as ResponseInit);

export const notFound = () => new Response(null, {
    status: 404,
    statusText: 'Not Found',
});

export const badRequest = (response: any) => new Response(JSON.stringify(response), {
    headers: {
        'Content-Type': 'application/json',
    },
    status: 400,
    statusText: 'Bad Request',
});

export const invalidRequestBody = (response: IInvalidRequestBody) => badRequest(response);

export const conflict = (message: string) => new Response(JSON.stringify({ message }), {
    headers: {
        'Content-Type': 'application/json',
    },
    status: 409,
    statusText: 'Conflict',
});

export const serverError = (message: string) => new Response(JSON.stringify({ message }), {
    headers: {
        'Content-Type': 'application/json',
    },
    status: 500,
    statusText: 'Internal Server Error',
});