import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const membershipRole = pgEnum("membership_role", ["OWNER", "ADMIN", "MEMBER", "CLIENT"]);
export const caseStatus = pgEnum("case_status", ["NEW", "TRIAGED", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"]);
export const casePriority = pgEnum("case_priority", ["LOW", "NORMAL", "HIGH", "URGENT"]);
export const messageVisibility = pgEnum("message_visibility", ["INTERNAL", "CLIENT"]);
export const invitationStatus = pgEnum("invitation_status", ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  caseSequence: integer("case_sequence").notNull().default(1000),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)]);

export const memberships = pgTable("memberships", {
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: membershipRole("role").notNull(),
  title: varchar("title", { length: 100 }),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
  index("memberships_user_idx").on(table.userId),
]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  externalReference: varchar("external_reference", { length: 100 }),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("clients_organization_name_idx").on(table.organizationId, table.name),
]);

export const clientContacts = pgTable("client_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  jobTitle: varchar("job_title", { length: 120 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("client_contacts_client_idx").on(table.organizationId, table.clientId),
  uniqueIndex("client_contacts_org_email_unique").on(table.organizationId, table.email),
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#6f727a"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("categories_org_name_unique").on(table.organizationId, table.name)]);

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  requesterContactId: uuid("requester_contact_id").references(() => clientContacts.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  status: caseStatus("status").notNull().default("NEW"),
  priority: casePriority("priority").notNull().default("NORMAL"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (table) => [
  uniqueIndex("cases_org_sequence_unique").on(table.organizationId, table.sequence),
  index("cases_org_status_activity_idx").on(table.organizationId, table.status, table.lastActivityAt),
  index("cases_org_assignee_status_idx").on(table.organizationId, table.assigneeId, table.status),
  index("cases_org_client_idx").on(table.organizationId, table.clientId),
]);

export const caseMessages = pgTable("case_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  visibility: messageVisibility("visibility").notNull(),
  body: text("body").notNull(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("case_messages_case_created_idx").on(table.organizationId, table.caseId, table.createdAt)]);

export const caseActivities = pgTable("case_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("case_activities_case_created_idx").on(table.organizationId, table.caseId, table.createdAt)]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  invitedById: uuid("invited_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: membershipRole("role").notNull(),
  tokenHash: text("token_hash").notNull(),
  status: invitationStatus("status").notNull().default("PENDING"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
  index("invitations_org_email_idx").on(table.organizationId, table.email),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  index("sessions_user_idx").on(table.userId),
]);

export const rateLimits = pgTable("rate_limits", {
  action: varchar("action", { length: 60 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(1),
}, (table) => [primaryKey({ columns: [table.action, table.keyHash, table.windowStart] })]);
