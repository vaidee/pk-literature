import { Inject, Injectable } from "@nestjs/common";
import type { Kysely, Transaction } from "kysely";
import type { SavedAddress } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem } from "../common/problem-details.exception";
import type { CreateAddressDto } from "./dto/create-address.dto";
import type { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressesService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async list(userId: string): Promise<SavedAddress[]> {
    const rows = await this.db
      .selectFrom("identity.addresses")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("createdAt", "asc")
      .execute();
    return rows.map(toSavedAddress);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<SavedAddress> {
    return this.db.transaction().execute(async (trx) => {
      if (dto.isDefault) {
        await clearExistingDefault(trx, userId);
      }

      const row = await trx
        .insertInto("identity.addresses")
        .values({
          userId,
          recipientName: dto.recipientName,
          line1: dto.line1,
          line2: dto.line2 ?? null,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          ...(dto.country !== undefined && { country: dto.country }),
          phone: dto.phone,
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return toSavedAddress(row);
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto): Promise<SavedAddress> {
    return this.db.transaction().execute(async (trx) => {
      await this.assertOwnership(trx, userId, addressId);

      if (dto.isDefault) {
        await clearExistingDefault(trx, userId);
      }

      const row = await trx
        .updateTable("identity.addresses")
        .set({
          ...(dto.recipientName !== undefined && { recipientName: dto.recipientName }),
          ...(dto.line1 !== undefined && { line1: dto.line1 }),
          ...(dto.line2 !== undefined && { line2: dto.line2 }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        })
        .where("id", "=", addressId)
        .where("userId", "=", userId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return toSavedAddress(row);
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const result = await this.db
      .deleteFrom("identity.addresses")
      .where("id", "=", addressId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    if (result.numDeletedRows === 0n) {
      throw new NotFoundProblem("Address", addressId);
    }
  }

  private async assertOwnership(trx: Transaction<Database>, userId: string, addressId: string): Promise<void> {
    const row = await trx
      .selectFrom("identity.addresses")
      .select("id")
      .where("id", "=", addressId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    if (!row) throw new NotFoundProblem("Address", addressId);
  }
}

// Clears any prior default before a new one is set — the partial
// unique index (idx_addresses_one_default_per_user) enforces "at most
// one" at the DB level, but doesn't itself demote the old default, so
// application code has to do that first within the same transaction
// (same two-step pattern as any "exactly one active X" invariant).
async function clearExistingDefault(trx: Transaction<Database>, userId: string): Promise<void> {
  await trx
    .updateTable("identity.addresses")
    .set({ isDefault: false })
    .where("userId", "=", userId)
    .where("isDefault", "=", true)
    .execute();
}

function toSavedAddress(row: {
  id: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}): SavedAddress {
  return {
    id: row.id,
    recipientName: row.recipientName,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone,
    isDefault: row.isDefault,
  };
}
