import { ObjectId } from 'mongodb';

export interface IAuthUser {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
}