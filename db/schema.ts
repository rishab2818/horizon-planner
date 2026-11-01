import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plannerData = sqliteTable("planner_data", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull().default("{}"),
  revision: integer("revision").notNull().default(0),
  updatedAt: integer("updated_at").notNull().default(0),
});
