import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user.js";
import { notificationSchema } from "./notification.js";
import { monitorSchema } from "./monitor.js";

export const mergedGQLSchema = mergeTypeDefs([
  userSchema,
  notificationSchema,
  monitorSchema,
]);
