import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { User } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem } from "../common/problem-details.exception";
import { toUser } from "../common/to-user";
import type { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async getById(userId: string): Promise<User> {
    const row = await this.db
      .selectFrom("identity.users")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    if (!row) throw new NotFoundProblem("User", userId);
    return toUser(row);
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<User> {
    const row = await this.db
      .updateTable("identity.users")
      .set({
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.preferredLanguage !== undefined && { preferredLanguage: dto.preferredLanguage }),
      })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();
    if (!row) throw new NotFoundProblem("User", userId);
    return toUser(row);
  }
}
