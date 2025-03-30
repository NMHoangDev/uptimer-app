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
  getUserActiveMonitors,
  startCreatedMonitors,
} from "../services/monitor.service.js";
import { startSingleJob } from "./jobs.js";
import { pubSub } from "../graphql/resolvers/monitor.js";
import logger from "../server/logger.js";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
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
export const enableAutoRefreshJob = (cookies: string): void => {
  const { verify } = pkg;
  const result: Record<string, string> = getCookies(cookies);
  const session: string = Buffer.from(result.session, "base64").toString();
  const payload: IAuthPayload = verify(
    JSON.parse(session).jwt,
    JWT_TOKEN
  ) as IAuthPayload;
  const enableAutoRefresh: boolean = JSON.parse(session).enableAutomaticRefresh;
  if (enableAutoRefresh) {
    startSingleJob(`${toLower(payload!.name)}`, appTimeZone, 10, async () => {
      const monitors: IMonitorDocument[] = await getUserActiveMonitors(
        payload.id
      );
      logger.info("Job is enabled");
      //TODO: publish data to client
      pubSub.publish("MONITORS_UPDATED", {
        monitorsUpdated: {
          userId: payload.id,
          monitors: monitors,
        },
      });
    });
  }
};
export const encodeBase64 = (user: string, pass: string): string => {
  return Buffer.from(`${user || ""}:${pass || ""}`).toString("base64");
};
export const uptimePercentage = (heartbeats: IHeartBeat[]): number => {
  if (!heartbeats || heartbeats.length === 0) return 0;

  const total = heartbeats.length;
  const down = heartbeats.filter((h) => h.status === 1).length;

  const uptime = ((total - down) / total) * 100;
  return isNaN(uptime) ? 0 : Math.round(uptime);
};

const getCookies = (cookie: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  cookie.split(":").forEach((cookieData: any) => {
    const parts: RegExpMatchArray | null = cookieData.match(/(.*?)=(.*)$/);
    cookies[parts![1].trim()] = (parts![2] || "").trim();
  });
  return cookies;
};
