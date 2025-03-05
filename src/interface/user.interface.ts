import { INotificationDocument } from "./notification.interface.js";

declare global {
  namespace Express {
    interface Request {
      currentuser?: IAuthPayload;
    }
  }
}
export interface IAuthPayload {
  id: number;
  name: string;
  email: string;
  iat?: number;
}
export interface IUserDocumnet {
  id?: number;
  username?: string;
  facebookID?: string;
  googleID?: string;
  email?: string;
  password?: string;
  createdAt?: Date;
  socialId?: string;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  hashedPassword(password: string): Promise<string>;
}
export interface IUserResponse {
  user: IUserDocumnet;
  notification: INotificationDocument[];
}
