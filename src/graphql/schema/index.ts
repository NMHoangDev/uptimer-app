import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user.js";
import { notificationSchema } from "./notification.js";

export const mergedGQLSchema = mergeTypeDefs([userSchema, notificationSchema]);
