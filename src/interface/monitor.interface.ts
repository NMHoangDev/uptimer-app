import { Request, Response } from "express";
import { INotificationDocument } from "./notification.interface.js";

export interface IMonitorDocument {
  id: number;
  monitorId: number;
  notificationId: number;
  name: string;
  active: boolean | number;
  status: number;
  userId: number;
  frequency: number;
  alertThreshold: number;
  url?: string;
  type: string;
  lastChanged?: Date | string;
  timeout: number;
  uptime?: number;
  redirects?: number;
  method: string;
  headers: string;
  body?: string;
  httpAuthMethod?: string;
  basicAuthUser?: string;
  basicAuthPass?: string;
  bearerToken?: string;
  contentType?: string;
  statusCode?: string;
  responseTime?: string;
  connection?: string;
  port?: number;
  heartbeats?: any[];
  notifications?: INotificationDocument;
}
export interface IMonitorResponse {
  status: string;
  responseTime: number;
  message: string;
  code: number;
}
export interface IMonitorArgs {
  monitor?: IMonitorDocument;
  monitorId?: string;
  userId: string;
  name?: string;
  active?: boolean;
  type?: string;
}
export interface AppContext {
  req: Request;
  res: Response;
}

export interface AppContext {
  req: Request;
  res: Response;
}
export interface AppContext {
  req: Request;
  res: Response;
}
