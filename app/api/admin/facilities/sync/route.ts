import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { 
  syncFacilityById, 
  batchSyncFacilities, 
  syncAllFacilities 
} from "@/lib/search/facility-sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { operation, facilityIds, facilityId } = body;

    if (!operation) {
      return new Response("Operation is required", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        operation,
        facilityId,
        facilityIdsCount: facilityIds?.length,
      },
      message: "Admin initiated Elasticsearch sync operation",
    });

    let result;

    switch (operation) {
      case 'sync_single':
        if (!facilityId) {
          return new Response("facilityId is required for sync_single operation", { status: 400 });
        }
        result = await syncFacilityById(facilityId, 'update');
        break;

      case 'sync_batch':
        if (!facilityIds || !Array.isArray(facilityIds) || facilityIds.length === 0) {
          return new Response("facilityIds array is required for sync_batch operation", { status: 400 });
        }
        result = await batchSyncFacilities(facilityIds, 'update');
        break;

      case 'sync_all':
        result = await syncAllFacilities();
        break;

      case 'delete_single':
        if (!facilityId) {
          return new Response("facilityId is required for delete_single operation", { status: 400 });
        }
        result = await syncFacilityById(facilityId, 'delete');
        break;

      case 'delete_batch':
        if (!facilityIds || !Array.isArray(facilityIds) || facilityIds.length === 0) {
          return new Response("facilityIds array is required for delete_batch operation", { status: 400 });
        }
        result = await batchSyncFacilities(facilityIds, 'delete');
        break;

      default:
        return new Response("Invalid operation. Supported operations: sync_single, sync_batch, sync_all, delete_single, delete_batch", { status: 400 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
        operation,
        success: result.success,
        summary: result.summary || null,
      },
      message: "Elasticsearch sync operation completed",
    });

    return Response.json({
      success: result.success,
      operation,
      result,
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to execute Elasticsearch sync operation",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        userId: session.user.id,
      },
      message: "Admin requested Elasticsearch sync operations documentation",
    });

    const documentation = {
      endpoint: "/api/admin/facilities/sync",
      methods: {
        POST: {
          description: "Execute Elasticsearch sync operations",
          operations: {
            sync_single: {
              description: "Sync a single facility to Elasticsearch",
              required_fields: ["operation", "facilityId"],
              example: {
                operation: "sync_single",
                facilityId: "clp123xyz789"
              }
            },
            sync_batch: {
              description: "Sync multiple facilities to Elasticsearch",
              required_fields: ["operation", "facilityIds"],
              example: {
                operation: "sync_batch",
                facilityIds: ["clp123xyz789", "clp456abc123"]
              }
            },
            sync_all: {
              description: "Sync all approved and active facilities to Elasticsearch",
              required_fields: ["operation"],
              example: {
                operation: "sync_all"
              }
            },
            delete_single: {
              description: "Remove a single facility from Elasticsearch",
              required_fields: ["operation", "facilityId"],
              example: {
                operation: "delete_single",
                facilityId: "clp123xyz789"
              }
            },
            delete_batch: {
              description: "Remove multiple facilities from Elasticsearch",
              required_fields: ["operation", "facilityIds"],
              example: {
                operation: "delete_batch",
                facilityIds: ["clp123xyz789", "clp456abc123"]
              }
            }
          }
        },
        GET: {
          description: "Get this documentation"
        }
      },
      notes: [
        "Only approved and active facilities are synced to Elasticsearch",
        "Sync operations are logged for audit purposes",
        "Operations are performed in batches to avoid overwhelming the system",
        "Failed syncs are logged but don't prevent the main operation from completing"
      ]
    };

    return Response.json(documentation);

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: "Failed to provide Elasticsearch sync documentation",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
