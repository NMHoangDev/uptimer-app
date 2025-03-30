import {
  IHeartBeat,
  IHeartBeatArgs,
} from "../../interface/heartbeat.interface.js";
import { AppContext } from "../../interface/monitor.interface.js";
import { getHeartbeats } from "../../services/monitor.service.js";
import { authenticateGraphQLRoute } from "../../utils/utils.js";

export const HeartbeatResolver = {
  Query: {
    async getHeartbeats(
      _: undefined,
      args: IHeartBeatArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { type, monitorId, duration } = args;
      const heartbeats: IHeartBeat[] = await getHeartbeats(
        type,
        parseInt(monitorId),
        parseInt(duration)
      );
      return {
        heartbeats: heartbeats ?? [],
      };
    },
  },
  HeartBeat: {
    timestamp: (heartbeat: IHeartBeat) => JSON.stringify(heartbeat.timestamp),
  },
};
