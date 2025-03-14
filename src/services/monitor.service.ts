import { Model, Op, where } from "sequelize";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import { MonitorModel } from "../models/monitor.model.js";
import logger from "../server/logger.js";
import { resolve } from "path";
import { result } from "lodash";

/**
 * Create a new monitors(trả về tất cả monitor trong database)
 * @returns {Promise<IMonitorDocument>}
 */
export const createMonitor = async (
  data: IMonitorDocument
): Promise<IMonitorDocument> => {
  try {
    const result: Model = await MonitorModel.create(data);
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
    for (let monitor of monitors) {
      logger.info(`Monitoring ${monitor}`);
    }
    return monitors;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error);
  }
};
/**
 * Return all active monitors(trả về tất cả monitor trong database)
 * @returns {Promise<IMonitorDocument[]>}
 */
export const getAllUserMonitor = async (): Promise<IMonitorDocument[]> => {
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
    const monitors: IMonitorDocument = MonitorModel.findOne({
      raw: true,

      where: {
        id: monitorId,
      },
      order: [["createdAt", "DESC"]],
    }) as unknown as IMonitorDocument;
    return monitors;
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
  } catch (error : any) {
    throw new Error(error)
  }
};
