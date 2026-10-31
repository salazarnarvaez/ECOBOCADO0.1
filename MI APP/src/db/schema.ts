import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Rescate · mercado local de comida rescatada
 * ---------------------------------------------------------------
 * users          -> vecinos y responsables de comercio (rol simple, demo auth)
 * businesses     -> comercios que publican rescates
 * listings       -> un "rescate": alimento en perfecto estado por vender / regalar
 * reservations   -> reserva de un vecino con código de retiro
 * alerts         -> búsqueda guardada: "avisame cuando haya algo así cerca"
 * notifications  -> avisos generados cuando un rescate matchea una alerta
 *
 * El orden de declaración importa: las referencias van de arriba hacia abajo.
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull().default("vecino"), // vecino | comercio
  emoji: varchar("emoji", { length: 12 }).notNull().default("🙂"),
  barrio: varchar("barrio", { length: 80 }).notNull().default("Centro"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  radioKm: integer("radio_km").notNull().default(2),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businesses = pgTable(
  "businesses",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    type: varchar("type", { length: 40 }).notNull(), // panaderia | restaurante | ...
    barrio: varchar("barrio", { length: 80 }).notNull(),
    address: varchar("address", { length: 180 }).notNull(),
    emoji: varchar("emoji", { length: 12 }).notNull().default("🏬"),
    bio: text("bio").notNull().default(""),
    verified: boolean("verified").notNull().default(false),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("businesses_owner_idx").on(table.ownerId)],
);

export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    category: varchar("category", { length: 40 }).notNull(), // panaderia | listo | frutas | lacteos | despensa
    emoji: varchar("emoji", { length: 12 }).notNull().default("🥖"),
    originalPriceCents: integer("original_price_cents").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0), // 0 = gratis
    quantityTotal: integer("quantity_total").notNull().default(1),
    quantityAvailable: integer("quantity_available").notNull().default(1),
    unitLabel: varchar("unit_label", { length: 40 }).notNull().default("unidad"),
    unitGrams: integer("unit_grams").notNull().default(300),
    reason: varchar("reason", { length: 80 }).notNull().default("Sobrante del día"),
    pickupFrom: timestamp("pickup_from", { withTimezone: true }).notNull(),
    pickupUntil: timestamp("pickup_until", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("activo"), // activo | agotado | cerrado
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("listings_business_idx").on(table.businessId),
    index("listings_status_idx").on(table.status),
  ],
);

export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    code: varchar("code", { length: 10 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("confirmada"), // confirmada | recogida | cancelada
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reservations_listing_idx").on(table.listingId),
    index("reservations_user_idx").on(table.userId),
  ],
);

/** Alerta guardada: "avisame cuando haya algo así cerca de mí". */
export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 80 }).notNull(),
    barrio: varchar("barrio", { length: 80 }),
    categoria: varchar("categoria", { length: 40 }),
    maxPriceCents: integer("max_price_cents"),
    soloGratis: boolean("solo_gratis").notNull().default(false),
    radioKm: integer("radio_km").notNull().default(2),
    activa: boolean("activa").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("alerts_user_idx").on(table.userId)],
);

/** Notificación generada cuando un rescate matchea una alerta. */
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    alertId: integer("alert_id").references(() => alerts.id, { onDelete: "set null" }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    leido: boolean("leido").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_listing_idx").on(table.listingId),
  ],
);

export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
