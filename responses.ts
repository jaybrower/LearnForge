export const notAuthorized = () => new Response(null, {
    status: 401,
    statusText: 'Not Authorized',
} as ResponseInit);

export const notFound = () => new Response(null, {
    status: 404,
    statusText: 'Not Found',
});