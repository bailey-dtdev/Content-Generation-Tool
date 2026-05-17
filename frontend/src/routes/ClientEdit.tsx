import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ClientsService, type ClientCreate, type ClientResponse } from "@/api/generated";
import { ClientForm } from "@/components/ClientForm";
import { SitemapUpload } from "@/components/SitemapUpload";

export function ClientEdit() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientResponse | undefined>();
  const [loading, setLoading] = useState(Boolean(clientId));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    ClientsService.clientsGetClient({ clientId })
      .then(setClient)
      .finally(() => setLoading(false));
  }, [clientId]);

  const save = async (payload: ClientCreate) => {
    setSubmitting(true);
    try {
      if (clientId) {
        setClient(
          await ClientsService.clientsUpdateClient({ clientId, requestBody: payload }),
        );
      } else {
        const created = await ClientsService.clientsCreateClient({
          requestBody: payload,
        });
        navigate(`/clients/${created.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">
        {clientId ? "Edit client" : "New client"}
      </h1>
      <ClientForm client={client} onSubmit={save} submitting={submitting} />
      {clientId ? <SitemapUpload clientId={clientId} /> : null}
    </div>
  );
}
