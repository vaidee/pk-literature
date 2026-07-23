import type { ColumnType, Generated } from "kysely";

// Hand-written against plan/database/ddl/identity.sql. Same
// CamelCasePlugin convention as every other service.

export interface UserTable {
  id: Generated<string>;
  email: string;
  passwordHash: string | null;
  displayName: string;
  phone: string | null;
  preferredLanguage: Generated<string>;
  createdAt: Generated<ColumnType<Date, never, never>>;
  updatedAt: Generated<ColumnType<Date, never, never>>;
}

export interface SessionTable {
  id: Generated<string>;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  createdAt: Generated<ColumnType<Date, never, never>>;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AddressTable {
  id: Generated<string>;
  userId: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: Generated<string>;
  phone: string;
  isDefault: Generated<boolean>;
  createdAt: Generated<ColumnType<Date, never, never>>;
  updatedAt: Generated<ColumnType<Date, never, never>>;
}

export interface AnonymousProfileTable {
  anonymousId: string;
  firstSeenAt: Generated<ColumnType<Date, never, never>>;
  lastSeenAt: Generated<ColumnType<Date, Date | undefined, Date>>;
  mergedIntoUserId: string | null;
  mergedAt: Date | null;
}

export interface ProfilePreferencesTable {
  userId: string;
  emailNotificationsEnabled: Generated<boolean>;
  smsNotificationsEnabled: Generated<boolean>;
  syncEnabled: Generated<boolean>;
  updatedAt: Generated<ColumnType<Date, never, never>>;
}

export interface Database {
  "identity.users": UserTable;
  "identity.sessions": SessionTable;
  "identity.addresses": AddressTable;
  "identity.anonymousProfiles": AnonymousProfileTable;
  "identity.profilePreferences": ProfilePreferencesTable;
}
