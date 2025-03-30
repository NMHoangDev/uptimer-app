import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user.js";
import { notificationSchema } from "./notification.js";
import { monitorSchema } from "./monitor.js";
import { heartbeatSchema } from "./heartbeats.js";

export const mergedGQLSchema = mergeTypeDefs([
  userSchema,
  notificationSchema,
  monitorSchema,
  heartbeatSchema,
]);
