import { getTimeStamp } from './utils';

export var setMotd = (port: string | number, endpoints: string[]): string => `
🤖  ${getTimeStamp()} Telegram bot service is now running on PORT: ${port}

👉  Endpoints:
${endpoints.map((_) => `    - ${_}`).join('\n')}

---
Press [CTRL + C] to stop the process
`;
