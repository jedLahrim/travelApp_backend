import { joLix } from "get-women-period/libs/ts-library";
import { UUID } from "typeorm/driver/mongodb/bson.typings";
import * as crypto from "crypto";

export class SecurityPipe {
  securityId: string;
  securityHash: UUID;

  get UUID(): UUID {
    return this.securityHash.toUUID();
  }
}
