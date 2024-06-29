import { MESSAGE_ENDPOINT } from "./endpoints";
import { getTimeStamp } from "./utils";

export var setMotd = (port: string | number): string => `
🤖  ${getTimeStamp()} Telegram bot service is now running on PORT: ${port}

👉  Endpoints:
      - 💌  ${MESSAGE_ENDPOINT}

---
Press [CTRL + C] to stop the process
`;
