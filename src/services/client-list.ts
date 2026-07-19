import "server-only";

import type { ClientListPage, ClientRepository } from "@/db/repositories/clients";
import { clientListQuerySchema, type ClientListQuery } from "@/domain/clients";
import type { WorkspaceRole } from "@/domain/invitations";

export type ClientListSearchParams = Record<string, string | string[] | undefined>;

function scalar(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseClientListSearchParams(params: ClientListSearchParams): ClientListQuery {
  const archived = scalar(params.archived) === "true";
  const parsed = clientListQuerySchema.safeParse({
    search: scalar(params.search),
    archived,
    cursor: scalar(params.cursor),
    limit: scalar(params.limit),
  });
  return parsed.success ? parsed.data : clientListQuerySchema.parse({ search: scalar(params.search), archived });
}

export function canManageClients(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function listClients(repository: Pick<ClientRepository, "list">, organizationId: string, query: ClientListQuery): Promise<ClientListPage> {
  return repository.list(organizationId, query);
}
