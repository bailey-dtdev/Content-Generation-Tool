import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ClientsService, type ClientResponse } from "@/api/generated";

export function ClientList() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    ClientsService.clientsListClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;
    await ClientsService.clientsDeleteClient({ clientId: id });
    load();
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Clients</h1>
        <Link
          to="/clients/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          New client
        </Link>
      </div>
      {clients.length === 0 ? (
        <p className="text-sm text-slate-500">No clients yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {clients.map((client) => (
            <li key={client.id} className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => navigate(`/clients/${client.id}`)}
                className="text-left"
              >
                <span className="font-medium">{client.name}</span>
                {client.industry ? (
                  <span className="ml-2 text-sm text-slate-500">{client.industry}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => void remove(client.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
