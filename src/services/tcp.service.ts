import { IHeartBeat } from "../interface/heartbeat.interface.js";
import { IMonitorDocument } from "../interface/monitor.interface.js";
import { startSingleJob } from "../utils/jobs.js";
import { appTimeZone } from "../utils/utils.js";
import dayjs from "dayjs";
import { Model, Op } from "sequelize";
import { TCPModel } from "../models/tcp.model.js";

export const createTcpHeartBeat = async (
  data: IHeartBeat
): Promise<IHeartBeat> => {
  try {
    const result: Model = await TCPModel.create(data);
    return result.dataValues;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getTcpHeartBeatsByDuration = async (
  monitorId: number,
  duration = 24
): Promise<IHeartBeat[]> => {
  try {
    const dateTime: Date = dayjs.utc().toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartBeat[] = (await TCPModel.findAll({
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

export const tcpStatusMonitor = (
  monitor: IMonitorDocument,
  name: string
): void => {
  const tcpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
    port: monitor.port,
    timeout: monitor.timeout,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    console.log(tcpMonitorData)
  );
};
