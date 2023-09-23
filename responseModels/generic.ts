export interface IInvalidRequestBodyProp {
    name: string;
    message: string;
    isRequired: boolean;
}

export interface IInvalidRequestBody {
    properties: IInvalidRequestBodyProp[];
}