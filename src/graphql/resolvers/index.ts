import { MonitorResolver } from "./monitor.js";
import { NotificationResolver } from "./notification.js";
import { UserResolver } from "./user.js";

export const resolvers = [UserResolver, NotificationResolver, MonitorResolver];
