import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import User from "@/utils/models/User";

export const dynamic = "force-dynamic";

const MAX_TEMPLATES = 20;
const MAX_ITEMS = 300;

interface IncomingItem {
  product?: string;
  quantity?: number;
}

// `createRouteHandler({ requireAuth })` does not actually enforce auth, so every
// handler checks the session itself.
async function requireSessionEmail() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await connectToDatabase();
  const isConnected = await waitForConnection(10000);
  if (!isConnected) {
    throw new Error("Database connection timeout");
  }

  return session.user.email;
}

async function readTemplates(email: string) {
  const user = await User.findOne({ email })
    .select("orderTemplates")
    .lean<{ orderTemplates?: unknown[] }>();
  return user?.orderTemplates ?? [];
}

// `User` is exported as `mongoose.models.User || mongoose.model(...)`, so a dev
// server that started before `orderTemplates` existed keeps the old schema and
// strict mode would silently drop every write. Fail loudly instead.
function schemaMissing() {
  const path = User.schema.path("orderTemplates") as
    | { schema?: { path: (name: string) => unknown } }
    | undefined;
  if (path?.schema?.path("displayNames.en")) return null;
  return NextResponse.json(
    {
      error: "Saved lists are unavailable",
      detail:
        "The server is running an older User schema — restart the dev server to enable saved lists.",
    },
    { status: 503 }
  );
}

function normalizeItems(items: unknown) {
  if (!Array.isArray(items)) return null;

  const normalized = items
    .filter((item): item is IncomingItem => Boolean(item))
    .map((item) => ({
      product: String(item.product ?? ""),
      quantity: Math.floor(Number(item.quantity)),
    }))
    .filter(
      (item) =>
        mongoose.Types.ObjectId.isValid(item.product) &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );

  return normalized.length > 0 ? normalized.slice(0, MAX_ITEMS) : null;
}

function normalizeName(name: unknown) {
  const trimmed = String(name ?? "").trim();
  return trimmed ? trimmed.slice(0, 60) : null;
}

// Bilingual list names. Either language alone is enough — the UI falls back to
// the other one — but at least one must be present.
function normalizeDisplayNames(value: unknown, fallback: unknown) {
  const source = (value ?? {}) as Record<string, unknown>;
  const en = normalizeName(source.en ?? fallback) ?? "";
  const zh = normalizeName(source["zh-TW"]) ?? "";

  if (!en && !zh) return null;
  return { displayNames: { en, "zh-TW": zh }, name: en || zh };
}

// Surfaces the real reason in the response. Without it a stale Mongoose model
// (dev server started before `orderTemplates` was added to the schema) looks
// like a generic save failure and needs a server restart to fix.
function failure(context: string, error: unknown, status = 500) {
  console.error(context, error);
  return NextResponse.json(
    {
      error: context,
      detail: error instanceof Error ? error.message : String(error),
    },
    { status }
  );
}

export async function GET() {
  try {
    const email = await requireSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ templates: await readTemplates(email) });
  } catch (error) {
    return failure("Failed to load saved lists", error);
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stale = schemaMissing();
    if (stale) return stale;

    const body = await request.json();
    const names = normalizeDisplayNames(body?.displayNames, body?.name);
    const items = normalizeItems(body?.items);

    if (!names) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!items) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    const existing = await readTemplates(email);
    if (existing.length >= MAX_TEMPLATES) {
      return NextResponse.json(
        { error: `You can save up to ${MAX_TEMPLATES} lists` },
        { status: 400 }
      );
    }

    // Atomic push rather than load-mutate-save: the user document is fetched
    // with a projection, so calling save() on it would revalidate paths that
    // were never loaded.
    await User.updateOne(
      { email },
      {
        $push: {
          orderTemplates: {
            name: names.name,
            displayNames: names.displayNames,
            items,
          },
        },
      }
    );

    return NextResponse.json({ templates: await readTemplates(email) });
  } catch (error) {
    return failure("Failed to save list", error);
  }
}

export async function PUT(request: Request) {
  try {
    const email = await requireSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stale = schemaMissing();
    if (stale) return stale;

    const body = await request.json();
    const id = String(body?.id ?? "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Name and items update independently: renaming from the profile page sends
    // only a name, overwriting from the order form sends only items.
    const update: Record<string, unknown> = {};

    if (body?.displayNames !== undefined || body?.name !== undefined) {
      const names = normalizeDisplayNames(body.displayNames, body.name);
      if (!names) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      update["orderTemplates.$.name"] = names.name;
      update["orderTemplates.$.displayNames"] = names.displayNames;
    }

    if (body?.items !== undefined) {
      const items = normalizeItems(body.items);
      if (!items) {
        return NextResponse.json(
          { error: "At least one product is required" },
          { status: 400 }
        );
      }
      update["orderTemplates.$.items"] = items;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const result = await User.updateOne(
      { email, "orderTemplates._id": id },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ templates: await readTemplates(email) });
  } catch (error) {
    return failure("Failed to update list", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const email = await requireSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stale = schemaMissing();
    if (stale) return stale;

    const id = new URL(request.url).searchParams.get("id") || "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await User.updateOne(
      { email },
      { $pull: { orderTemplates: { _id: new mongoose.Types.ObjectId(id) } } }
    );

    return NextResponse.json({ templates: await readTemplates(email) });
  } catch (error) {
    return failure("Failed to delete list", error);
  }
}
