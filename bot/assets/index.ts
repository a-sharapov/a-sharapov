import { ENDPOINTS } from "./endpoints";
import { getTimeStamp } from "./utils";

export var setMotd = (port: string | number): string => `
🤖  ${getTimeStamp()} Telegram bot service is now running on PORT: ${port}

👉  Endpoints:
${Object.values(ENDPOINTS).reduce(
  (message, endpoint) => `${message}    - ${endpoint}\n`,
  ""
)}

---
Press [CTRL + C] to stop the process
`;
