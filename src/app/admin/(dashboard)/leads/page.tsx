import { prisma } from "@/lib/prisma";
import { LeadsKanban, type LeadItem } from "@/components/admin/LeadsKanban";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const items: LeadItem[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    type: l.type,
    status: l.status,
    interest: l.interest,
    message: l.message,
    visitDate: l.visitDate?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads Pipeline</h1>
        <p className="mt-1 text-sm text-white/40">
          Move leads through the pipeline with the stage arrows on each card.
        </p>
      </div>
      <LeadsKanban initialLeads={items} />
    </div>
  );
}
