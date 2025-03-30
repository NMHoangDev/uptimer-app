import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import { MongoModel } from "../models/mongo.model.js";
import { mongoMonitor } from "../monitors/mongo.monitor.js";
import { startSingleJob } from "../utils/jobs.js";
import { appTimeZone } from "../utils/utils.js";
import dayjs from "dayjs";
import { Model, Op } from "sequelize";

export const createMongoHeartBeat = async (
  data: IHeartBeat
): Promise<IHeartBeat> => {
  try {
    const result: Model = await MongoModel.create(data);
    return result.dataValues;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getMongoHeartBeatsByDuration = async (
  monitorId: number,
  duration = 24
): Promise<IHeartBeat[]> => {
  try {
    const dateTime: Date = dayjs.utc().toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartBeat[] = (await MongoModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          { monitorId },
          {
            timestamp: {
              [Op.gte]: dateTime,
            },
          },
        ],
      },
      order: [["timestamp", "DESC"]],
    })) as unknown as IHeartBeat[];
    return heartbeats;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const mongoStatusMonitor = (
  monitor: IMonitorDocument,
  name: string
): void => {
  const mongoMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    mongoMonitor.start(mongoMonitorData)
  );
};
