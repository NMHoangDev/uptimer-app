import { Request } from "express";
import { GraphQLError } from "graphql";
import pkg from "jsonwebtoken";

import { IAuthPayload } from "../interface/user.interface.js";
import { JWT_TOKEN } from "../server/config.js";
import { resolve } from "path";
import pkgLodash from "lodash";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import {
  getAllUserActiveMonitor,
  getMonitorById,
  startCreatedMonitors,
} from "../services/monitor.service.js";
const { min, toLower } = pkgLodash;

export const appTimeZone: string =
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 *
 * Email validator
 * @returns {boolean}
 */
export const isEmail = (email: string): boolean => {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  return regexExp.test(email);
};
/**
 * Authenticates user access to protected routes
 * @param {req}
 * @returns {void}
 */

export const authenticateGraphQLRoute = (req: Request): void => {
  if (!req.session?.jwt) {
    throw new GraphQLError("Please login again");
  }
  const { verify } = pkg;
  try {
    const payload: IAuthPayload = verify(
      req.session?.jwt,
      JWT_TOKEN
    ) as IAuthPayload;
    req.currentUser = payload;
  } catch (error: any) {
    throw new GraphQLError(error);
  }
};
/**
 * Delay for specified number of seconds
 * @param ms Number of miliseconds to sleep for
 * @returns {Promise<void>}
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
/**
 * Return a random integer between min and max values
 * @param min
 * @param max
 * @returns {number}
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const startMonitors = async (): Promise<void> => {
  const list: IMonitorDocument[] = await getAllUserActiveMonitor();

  for (const monitor of list) {
    startCreatedMonitors(monitor, toLower(monitor.name), monitor.type);
    await sleep(getRandomInt(300, 1000));
  }
};
export const resumeMonitors = async (monitorId: number): Promise<void> => {
  const monitor: IMonitorDocument = await getMonitorById(monitorId);
  startCreatedMonitors(monitor, toLower(monitor.name), monitor.type);
  await sleep(getRandomInt(300, 1000));
};
