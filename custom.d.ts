import { Socket, DefaultEventsMap } from "socket.io";

declare namespace Express {
  export interface Request {
    user?: string | jwt.JwtPayload;
  }
}

export type socketType = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
