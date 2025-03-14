import { INotificationDocument } from "./notification.interface.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: IAuthPayload;
    }
  }
}
export interface IAuthPayload {
  id: number;
  name: string;
  email: string;
  iat?: number;
}
export interface IUserDocument {
  id?: number;
  username?: string;
  facebookID?: string;
  googleID?: string;
  email?: string;
  password?: string;
  createdAt?: Date;
  socialId?: string;
  type: string;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  hashedPassword(password: string): Promise<string>;
}
export interface IUserResponse {
  user: IUserDocument;
  notifications: INotificationDocument[];
}
