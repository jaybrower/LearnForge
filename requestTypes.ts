import { IAuthUser } from './responseModels';
import jwt from 'jsonwebtoken';

export type RequestFunction = (req: ExpandedRequest) => Promise<Response>;

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

    public get url(): URL {
        return new URL(this._req.url);
    }

    public get method(): string {
        return this._req.method;
    }

    public get headers(): Headers {
        return this._req.headers;
    }

    private _user: IAuthUser | null = null;
    public get user(): IAuthUser | null {
        if (this._user) {
            return this._user;
        }

        const authToken = this.getAuthToken();
        if (!authToken) {
            return null;
        }

        try {
            this._user = jwt.verify(authToken, Bun.env.LF_JWT_SIGNING_KEY as string) as IAuthUser;
        } catch (err) {
            return null;
        }

        return this._user;
    }

    public getParam(name: string, defaultValue: any = null) {
        return (this._params || {})[name] || defaultValue;
    }

    public getRequest(): Request {
        return this._req;
    }

    private _cookies: any;
    public getCookies(): any {
        if (this._cookies) {
            return this._cookies;
        }

        const cookies = (this.headers.get('Cookie') || '').split(';').reduce((a, b) => {
            const pair = b.trim().split('=');
            a[pair[0]] = pair.slice(1).join('=');
            return a;
        }, {} as any);

        this._cookies = cookies;
        return this._cookies;
    }

    private _token: string | null = null;
    public getAuthToken(): string | null {
        if (this._token) {
            return this._token;
        }

        // Check the query string first.
        let token = this.url.searchParams.get('lf_auth_token');
        if (!token) {
            // Check the `Authorization` header next.
            const authHeader = this.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice('Bearer '.length);
            }

            // Check the cookies last.
            if (!token) {
                token = this.getCookies()['lf_auth_token'];
            }
        }

        this._token = token;
        return this._token;
    }

    private _jsonBody: any;
    public async getJsonBodyAsync(): Promise<any> {
        if (this._jsonBody) {
            return this._jsonBody;
        }

        if (!this._req.body) {
            return null;
        }

        const reader = this._req.body.getReader();
        const decoder = new TextDecoder();
        const chunks: string[] = [];

        async function readChunk(): Promise<any> {
            const result = await reader.read();
            if (result.done) {
                return JSON.parse(chunks.join(''));
            }

            chunks.push(decoder.decode(result.value));
            return readChunk();
        }

        this._jsonBody = await readChunk();
        return this._jsonBody;
    }
}