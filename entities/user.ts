export interface IUser {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    isDeleted: boolean;
    isVerified: boolean;
    createdDate: Date;
}