import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// Chuyển đổi `import.meta.url` thành đường dẫn thư mục
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load `.env`
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = process.env;

export const POSTGRES_DB = env.POSTGRES_DB as string;
export const NODE_ENV = env.NODE_ENV as string;
export const SECRET_KEY_ONE = env.SECRET_KEY_ONE as string;
export const SECRET_KEY_TWO = env.SECRET_KEY_TWO as string;
export const JWT_TOKEN = env.JWT_TOKEN as string;
export const SENDER_EMAIL = env.SENDER_EMAIL as string;
export const SENDER_EMAIL_PASSWORD = env.SENDER_EMAIL_PASSWORD as string;
export const CLIENT_URL = env.CLIENT_URL as string;
export const PORT = env.PORT;
