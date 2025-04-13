import { Model, Op, where } from "sequelize";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import { MonitorModel } from "../models/monitor.model.js";
import logger from "../server/logger.js";
import dayjs from "dayjs";
import {
  getHttpHeartBeatsByDuration,
  httpStatusMonitor,
} from "./http.service.js";
import pkg from "lodash";
import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { getSingleNotificationGroup } from "./notification.service.js";
import { uptimePercentage } from "../utils/utils.js";
import { HttpModel } from "../models/http.model.js";
import {
  getMongoHeartBeatsByDuration,
  mongoStatusMonitor,
} from "./mongo.service.js";
import { MongoModel } from "../models/mongo.model.js";
import { RedisModel } from "../models/redis.model.js";
import {
  getRedisHeartBeatsByDuration,
  redisStatusMonitor,
} from "./redis.service.js";
import { getTcpHeartBeatsByDuration, tcpStatusMonitor } from "./tcp.service.js";
import { TCPModel } from "../models/tcp.model.js";
const HTTP_TYPE = "http";
const TCP_TYPE = "tcp";
const MONGO_TYPE = "mongo";
const REDIS_TYPE = "redis";
const { toLower } = pkg;

/**
 * Create a new monitors(trả về tất cả monitor trong database)
 * @returns {Promise<IMonitorDocument>}
 */
export const createMonitor = async (
  data: IMonitorDocument
): Promise<IMonitorDocument> => {
  try {
    const result: Model = await MonitorModel.create(data);
    console.log(result.dataValues);
    return result.dataValues;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getUserMonitors = async (
  userId: number,
  active: boolean
): Promise<IMonitorDocument[]> => {
  try {
    const monitors: IMonitorDocument[] = MonitorModel.findAll({
      raw: true,
      where: {
        [Op.and]: [{ userId: userId, ...(active && { active: true }) }],
      },
      order: [["createdAt", "DESC"]],
    }) as unknown as IMonitorDocument[];
    return monitors;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error);
  }
};
export const getUserActiveMonitors = async (
  userId: number
): Promise<IMonitorDocument[]> => {
  try {
    const monitors: IMonitorDocument[] = await getUserMonitors(userId, true);
    let heartbeats: IHeartBeat[] = [];
    const updatedMonitors: IMonitorDocument[] = [];
    for (let monitor of monitors) {
      const group = await getSingleNotificationGroup(monitor.notificationId!);
      heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);
      //TODO: calculate uptime
      const uptime = uptimePercentage(heartbeats);
      monitor = {
        ...monitor,
        uptime: 0,
        heartbeats: heartbeats.slice(0, 16),
        notifications: group,
      };
      updatedMonitors.push(monitor);
      logger.info(`Monitoring ${monitor}`);
    }
    return updatedMonitors;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error);
  }
};
/**
 * Return all active monitors(trả về tất cả monitor trong database)
 * @returns {Promise<IMonitorDocument[]>}
 */
export const getAllUserActiveMonitor = async (): Promise<
  IMonitorDocument[]
> => {
  try {
    const monitors: IMonitorDocument[] = MonitorModel.findAll({
      raw: true,

      where: {
        active: true,
      },
      order: [["createdAt", "DESC"]],
    }) as unknown as IMonitorDocument[];
    return monitors;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error);
  }
};

export const getMonitorById = async (
  monitorId: number
): Promise<IMonitorDocument> => {
  try {
    const monitor: IMonitorDocument = (await MonitorModel.findOne({
      raw: true,
      where: {
        id: monitorId,
      },
      order: [["createdAt", "DESC"]],
    })) as unknown as IMonitorDocument;
    return monitor;
  } catch (error: any) {
    throw new Error(error);
  }
};
export const toggleMonitor = async (
  monitorId: number,
  userId: number,
  active: boolean
): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(
      { active },
      {
        where: {
          [Op.and]: [{ id: monitorId }, { userId: userId }],
        },
      }
    );
    const result: IMonitorDocument[] = await getUserMonitors(userId, false);
    return result as unknown as IMonitorDocument[];
  } catch (error: any) {
    throw new Error(error);
  }
};
export const updateSingleMonitor = async (
  monitorId: number,
  userId: number,
  data: IMonitorDocument
): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(data, {
      where: { id: monitorId },
    });
    const result: IMonitorDocument[] = await getUserMonitors(userId, false);
    return result;
  } catch (error: any) {
    throw new Error(error);
  }
};
export const startCreatedMonitors = (
  monitor: IMonitorDocument,
  name: string,
  type: string
) => {
  if (type === HTTP_TYPE) {
    httpStatusMonitor(monitor!, toLower(name));
  }
  if (type === TCP_TYPE) {
    tcpStatusMonitor(monitor!, toLower(name));
  }
  if (type === MONGO_TYPE) {
    mongoStatusMonitor(monitor!, toLower(name));
  }
  if (type === REDIS_TYPE) {
    redisStatusMonitor(monitor!, toLower(name));
  }
};
export const updateMonitorStatus = async (
  monitor: IMonitorDocument,
  timestamp: number,
  type: string
): Promise<IMonitorDocument> => {
  try {
    const now = timestamp ? dayjs(timestamp).toDate() : dayjs().toDate();
    const { id, status } = monitor;
    const updatedMonitor: IMonitorDocument = { ...monitor };
    updatedMonitor.status = type === "success" ? 0 : 1;
    const isStatus = type === "success" ? true : false;
    if (isStatus && status === 1) {
      updatedMonitor.lastChanged = now;
    } else if (!isStatus && status === 0) {
      updatedMonitor.lastChanged = now;
    }
    await MonitorModel.update(updatedMonitor, { where: { id } });
    return updatedMonitor;
  } catch (error: any) {
    throw new Error(error);
  }
};
export const deleteSingleMonitor = async (
  monitorId: number,
  userId: number,
  type: string
): Promise<IMonitorDocument[]> => {
  try {
    //TODO: Create a method to delete monitor heartbeats
    await MonitorModel.destroy({
      where: { id: monitorId },
    });
    const result: IMonitorDocument[] = await getUserMonitors(userId, false);
    return result;
  } catch (error: any) {
    throw new Error(error);
  }
};
/**
 * Get monitor heartbeats
 * @param type
 * @param monitorId
 * @param duration
 * @returns {Promise<IHeartbeat[]>}
 */
export const getHeartbeats = async (
  type: string,
  monitorId: number,
  duration: number
): Promise<IHeartBeat[]> => {
  let heartbeats: IHeartBeat[] = [];

  if (type === HTTP_TYPE) {
    heartbeats = await getHttpHeartBeatsByDuration(monitorId, duration);
  }
  if (type === TCP_TYPE) {
    heartbeats = await getTcpHeartBeatsByDuration(monitorId, duration);
  }
  if (type === MONGO_TYPE) {
    heartbeats = await getMongoHeartBeatsByDuration(monitorId, duration);
  }
  if (type === REDIS_TYPE) {
    heartbeats = await getRedisHeartBeatsByDuration(monitorId, duration);
  }
  return heartbeats;
};

export const deleteMonitorTypeHeartbeats = async (
  monitorId: number,
  type: string
): Promise<void> => {
  let model = null;
  if (type === HTTP_TYPE) {
    model = HttpModel;
  }
  if (type === MONGO_TYPE) {
    model = MongoModel;
  }
  if (type === REDIS_TYPE) {
    model = RedisModel;
  }
  if (type === TCP_TYPE) {
    model = TCPModel;
  }

  if (model !== null) {
    await model.destroy({
      where: { monitorId },
    });
  }
};
