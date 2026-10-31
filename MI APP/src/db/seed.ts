import { sql } from "drizzle-orm";
import { db } from "@/db";
import { alerts, businesses, listings, notifications, reservations, users } from "@/db/schema";
import { BARRIO_COORDS } from "@/lib/constants";

const H = 60 * 60 * 1000;

function at(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * H);
}

let seeded = false;

/**
 * Carga datos de demostración la primera vez que la app corre contra una base vacía.
 * Es idempotente: si ya hay usuarios, no hace nada.
 */
export async function ensureSeed() {
  if (seeded) return;
  seeded = true;

  try {
    const existing = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    if ((existing[0]?.count ?? 0) > 0) return;

    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: "Lucía Ferrer",
          email: "lucia@rescate.app",
          role: "vecino",
          emoji: "🌿",
          barrio: "Palermo",
          lat: -34.5771,
          lng: -58.4241,
          radioKm: 2,
        },
        {
          name: "Martín Díaz",
          email: "martin@rescate.app",
          role: "vecino",
          emoji: "🚲",
          barrio: "Almagro",
          lat: -34.6092,
          lng: -58.4181,
          radioKm: 3,
        },
        {
          name: "Ana Ruiz",
          email: "ana@rescate.app",
          role: "vecino",
          emoji: "🍲",
          barrio: "San Telmo",
          lat: -34.6223,
          lng: -58.3702,
          radioKm: 2,
        },
        {
          name: "Sofía Ortiz",
          lat: -34.578,
          lng: -58.426,
          radioKm: 2,
          email: "sofia@panaderiaortiz.com",
          role: "comercio",
          emoji: "🥐",
          barrio: "Palermo",
        },
        {
          name: "Bruno Costa",
          lat: -34.621,
          lng: -58.372,
          radioKm: 2,
          email: "bruno@lamesa.com",
          role: "comercio",
          emoji: "🍽️",
          barrio: "San Telmo",
        },
        {
          name: "Kelvin Núñez",
          lat: -34.619,
          lng: -58.44,
          radioKm: 2,
          email: "kelvin@verduleriaelraton.com",
          role: "comercio",
          emoji: "🥕",
          barrio: "Caballito",
        },
      ])
      .returning();

    const byEmail = (email: string) => insertedUsers.find((u) => u.email === email)!.id;

    const insertedBusinesses = await db
      .insert(businesses)
      .values([
        {
          ownerId: byEmail("sofia@panaderiaortiz.com"),
          name: "Panadería Ortiz",
          lat: -34.5786,
          lng: -58.4271,
          type: "panaderia",
          barrio: "Palermo",
          address: "Av. Santa Fe 3120",
          emoji: "🥐",
          bio: "Horno a leña desde 1987. Todo lo que no se vendió al cierre, acá encuentra dueño.",
          verified: true,
        },
        {
          ownerId: byEmail("bruno@lamesa.com"),
          name: "La Mesa Cocina",
          lat: -34.6204,
          lng: -58.3731,
          type: "restaurante",
          barrio: "San Telmo",
          address: "Bolívar 870",
          emoji: "🍲",
          bio: "Cocina de temporada. Los lotes se arman con lo que sobró del servicio del mediodía.",
          verified: true,
        },
        {
          ownerId: byEmail("kelvin@verduleriaelraton.com"),
          name: "Verdulería El Ratón",
          lat: -34.6196,
          lng: -58.4412,
          type: "verduleria",
          barrio: "Caballito",
          address: "Rivadavia 5402",
          emoji: "🥕",
          bio: "Fruta y verdura imperfecta pero impecable de sabor. Vendemos por bolsa.",
          verified: false,
        },
        {
          ownerId: byEmail("sofia@panaderiaortiz.com"),
          name: "Cafetería Nube",
          lat: -34.5892,
          lng: -58.3971,
          type: "cafeteria",
          barrio: "Recoleta",
          address: "Callao 1420",
          emoji: "☕",
          bio: "Tortas, facturas y sobres de café de la tarde.",
          verified: true,
        },
        {
          ownerId: byEmail("bruno@lamesa.com"),
          name: "Dietética Grano",
          lat: -34.6074,
          lng: -58.4209,
          type: "supermercado",
          barrio: "Almagro",
          address: "Corrientes 4021",
          emoji: "🛒",
          bio: "A granel y productos orgánicos con empaques golpeados.",
          verified: false,
        },
      ])
      .returning();

    const biz = (name: string) => insertedBusinesses.find((b) => b.name === name)!.id;

    const insertedListings = await db
      .insert(listings)
      .values([
        {
          businessId: biz("Panadería Ortiz"),
          title: "Bolsa de pan del día (mix)",
          description:
            "Pan francés, integral y centeno del día. Al cierre queda una bolsa surtida: no es de ayer, solo no se vendió.",
          category: "panaderia",
          emoji: "🥖",
          originalPriceCents: 4500,
          priceCents: 900,
          quantityTotal: 12,
          quantityAvailable: 7,
          unitLabel: "bolsa de 1 kg",
          unitGrams: 1000,
          reason: "Sobrante del día",
          pickupFrom: at(2),
          pickupUntil: at(6),
        },
        {
          businessId: biz("Panadería Ortiz"),
          title: "Facturas surtidas (docena)",
          description: "Medialunas de manteca, vigilias y cañoncitos. Perfectas para el desayuno de mañana.",
          category: "panaderia",
          emoji: "🥐",
          originalPriceCents: 12000,
          priceCents: 0,
          quantityTotal: 5,
          quantityAvailable: 5,
          unitLabel: "docena",
          unitGrams: 700,
          reason: "Producción de más",
          pickupFrom: at(1.5),
          pickupUntil: at(4),
        },
        {
          businessId: biz("La Mesa Cocina"),
          title: "Lote de 3 viandas de guiso de lentejas",
          description:
            "Sobró del servicio del mediodía. Envasado en caliente, refrigerado y etiquetado con la hora.",
          category: "listo",
          emoji: "🍲",
          originalPriceCents: 9600,
          priceCents: 2500,
          quantityTotal: 8,
          quantityAvailable: 6,
          unitLabel: "lote x3",
          unitGrams: 1500,
          reason: "Sobrante del día",
          pickupFrom: at(3),
          pickupUntil: at(8),
        },
        {
          businessId: biz("La Mesa Cocina"),
          title: "Rabanitos y zanahorias para caldo",
          description: "Restos de mise en place, limpios y frescos. Ideales para caldo, no para ensalada.",
          category: "frutas",
          emoji: "🥬",
          originalPriceCents: 2000,
          priceCents: 0,
          quantityTotal: 10,
          quantityAvailable: 10,
          unitLabel: "bolsa",
          unitGrams: 900,
          reason: "Fruta/verdura imperfecta",
          pickupFrom: at(-1),
          pickupUntil: at(5),
        },
        {
          businessId: biz("Verdulería El Ratón"),
          title: "Caja de bananas muy maduras",
          description: "Manchadas y dulcísimas: perfectas para licuado, banana bread o congelar.",
          category: "frutas",
          emoji: "🍌",
          originalPriceCents: 6400,
          priceCents: 1500,
          quantityTotal: 15,
          quantityAvailable: 11,
          unitLabel: "caja de 2 kg",
          unitGrams: 2000,
          reason: "Fruta/verdura imperfecta",
          pickupFrom: at(4),
          pickupUntil: at(26),
        },
        {
          businessId: biz("Verdulería El Ratón"),
          title: "Bolsa de ensalada mixta",
          description: "Lechuga, rúcula y espinaca del martes. Se nota el tallo, se consume hoy.",
          category: "frutas",
          emoji: "🥗",
          originalPriceCents: 3200,
          priceCents: 800,
          quantityTotal: 9,
          quantityAvailable: 2,
          unitLabel: "bolsa de 400 g",
          unitGrams: 400,
          reason: "Se acerca el vencimiento",
          pickupFrom: at(1),
          pickupUntil: at(7),
        },
        {
          businessId: biz("Cafetería Nube"),
          title: "Cheesecake entera (8 porciones)",
          description: "La preparamos para un evento que se canceló. Sellada, sin abrir, vence en 3 días.",
          category: "lacteos",
          emoji: "🍰",
          originalPriceCents: 18000,
          priceCents: 4500,
          quantityTotal: 2,
          quantityAvailable: 1,
          unitLabel: "torta entera",
          unitGrams: 1600,
          reason: "Pedido cancelado",
          pickupFrom: at(6),
          pickupUntil: at(11),
        },
        {
          businessId: biz("Cafetería Nube"),
          title: "Sobres de café de especialidad",
          description: "Paquetes con el pliegue abierto en el mostrador. Café intacto, empaque no.",
          category: "despensa",
          emoji: "☕",
          originalPriceCents: 7800,
          priceCents: 2000,
          quantityTotal: 6,
          quantityAvailable: 6,
          unitLabel: "paquete 500 g",
          unitGrams: 500,
          reason: "Empaque dañado",
          pickupFrom: at(9),
          pickupUntil: at(30),
        },
        {
          businessId: biz("Dietética Grano"),
          title: "Frascos de granola a granel",
          description: "Granola de almendras y pasas. Los frascos llegaron con la tapa abollada.",
          category: "despensa",
          emoji: "🥣",
          originalPriceCents: 5200,
          priceCents: 1300,
          quantityTotal: 14,
          quantityAvailable: 14,
          unitLabel: "frasco 750 g",
          unitGrams: 750,
          reason: "Empaque dañado",
          pickupFrom: at(20),
          pickupUntil: at(44),
        },
        {
          businessId: biz("Dietética Grano"),
          title: "Yogures enteros x6",
          description: "Lote con 48 h de vida útil restante. Cadena de frío asegurada, traé bolsa térmica.",
          category: "lacteos",
          emoji: "🥛",
          originalPriceCents: 6900,
          priceCents: 0,
          quantityTotal: 7,
          quantityAvailable: 7,
          unitLabel: "pack x6",
          unitGrams: 1250,
          reason: "Se acerca el vencimiento",
          pickupFrom: at(5),
          pickupUntil: at(12),
        },
        {
          businessId: biz("Panadería Ortiz"),
          title: "Pan de masa madre (agotado ayer)",
          description: "El más pedido. Suele volar antes de las 19 h.",
          category: "panaderia",
          emoji: "🍞",
          originalPriceCents: 5200,
          priceCents: 1200,
          quantityTotal: 8,
          quantityAvailable: 0,
          unitLabel: "pieza de 900 g",
          unitGrams: 900,
          reason: "Sobrante del día",
          pickupFrom: at(-20),
          pickupUntil: at(-4),
          status: "agotado",
        },
        {
          businessId: biz("La Mesa Cocina"),
          title: "Pizza media masa x2",
          description: "Del servicio de anoche, ya retiradas por vecinos del barrio.",
          category: "listo",
          emoji: "🍕",
          originalPriceCents: 8800,
          priceCents: 2200,
          quantityTotal: 6,
          quantityAvailable: 0,
          unitLabel: "pack x2",
          unitGrams: 1100,
          reason: "Producción de más",
          pickupFrom: at(-30),
          pickupUntil: at(-18),
          status: "agotado",
        },
      ])
      .returning();

    const listing = (title: string) => insertedListings.find((l) => l.title.startsWith(title))!.id;
    const lucia = byEmail("lucia@rescate.app");
    const martin = byEmail("martin@rescate.app");
    const ana = byEmail("ana@rescate.app");

    await db.insert(reservations).values([
      { listingId: listing("Pan de masa madre"), userId: lucia, quantity: 1, code: "PAN7KD", status: "recogida" },
      { listingId: listing("Pan de masa madre"), userId: martin, quantity: 2, code: "MTR4QX", status: "recogida" },
      { listingId: listing("Pizza media masa"), userId: ana, quantity: 1, code: "PZA9LM", status: "recogida" },
      { listingId: listing("Pizza media masa"), userId: lucia, quantity: 1, code: "PZA2RB", status: "recogida" },
      { listingId: listing("Rabanitos y zanahorias"), userId: martin, quantity: 2, code: "VRD5TT", status: "confirmada" },
      { listingId: listing("Bolsa de pan del día"), userId: ana, quantity: 2, code: "PAN8WJ", status: "confirmada" },
    ]);

    // Alertas de ejemplo: "avisame cuando haya algo así cerca de mí"
    const insertedAlerts = await db
      .insert(alerts)
      .values([
        {
          userId: byEmail("lucia@rescate.app"),
          nombre: "Pan y facturas a pie de casa",
          barrio: "Palermo",
          categoria: "panaderia",
          maxPriceCents: 2000,
          soloGratis: false,
          radioKm: 2,
        },
        {
          userId: byEmail("lucia@rescate.app"),
          nombre: "Solo gratis, lo que sea",
          barrio: "Palermo",
          categoria: null,
          maxPriceCents: null,
          soloGratis: true,
          radioKm: 4,
        },
        {
          userId: byEmail("martin@rescate.app"),
          nombre: "Viandas baratas para el trabajo",
          barrio: "Almagro",
          categoria: "listo",
          maxPriceCents: 3000,
          soloGratis: false,
          radioKm: 3,
        },
      ])
      .returning();

    // Una notificación ya generada para que la campana no arranque vacía.
    await db.insert(notifications).values([
      {
        userId: byEmail("lucia@rescate.app"),
        alertId: insertedAlerts[0]?.id ?? null,
        listingId: listing("Facturas surtidas"),
        titulo: "Facturas surtidas (docena) · gratis en Palermo",
      },
      {
        userId: byEmail("martin@rescate.app"),
        alertId: insertedAlerts[2]?.id ?? null,
        listingId: listing("Lote de 3 viandas"),
        titulo: "Lote de 3 viandas de guiso · San Telmo",
      },
    ]);
  } catch (error) {
    seeded = false;
    console.error("[rescate] seed omitido:", error);
  }
}
