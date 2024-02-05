import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as requestIp from "request-ip";
import * as useragent from "useragent";

export const IpPlusClientAddress = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (req.clientIp) return req.clientIp;

    const ip = requestIp.getClientIp(req); // In case we forgot to include requestIp.mw() in main.ts
    const browser = req.headers["user-agent"];

    const agent = useragent.parse(browser);

    return {
      ip: req.headers["x-real-ip"] ?? ip,
      browser: {
        name: agent.family,
        version: agent.toVersion(),
        source: agent.source
      },
      os: {
        name: agent.os.family,
        version: agent.os.toVersion()
      }
    };
  }
);
