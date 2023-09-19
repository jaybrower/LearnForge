export type RequestFunction = (req: ExpandedRequest) => Response;

export interface IRequestUser {
    email: string,
    firstName: string,
    id: number,
    lastName: string,
}

export interface IEndpointOptions {
    methods: string[],
    path: string,
    pathExp: RegExp,
}

export class ExpandedRequest {
    private readonly _req: Request;
    private readonly _params: any;

    constructor(req: Request, params: any = null) {
        this._req = req;
        this._params = params;
    }

    public get url(): string {
        return this._req.url;
    }

    public get method(): string {
        return this._req.method;
    }

    public get headers(): Headers {
        return this._req.headers;
    }

    public get path(): string {
        return this._req.url.replace(/https?:\/\/[^\/\\]+\//i, '');
    }

    public get user(): IRequestUser {
        // TODO: Pull this information from the token in the `Authorization` header.
        return {
            email: 'jay.brower.229@gmail.com',
            firstName: 'Jay',
            id: 1,
            lastName: 'Brower',
        } as IRequestUser;
    }

    public getParam(name: string, defaultValue: any = null) {
        return (this._params || {})[name] || defaultValue;
    }

    public getRequest(): Request {
        return this._req;
    }
}