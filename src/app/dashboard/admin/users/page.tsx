"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, UserCheck, UserX, RefreshCw } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionStatus: string;
  plan: string;
  createdAt: string;
  _count: { prospects: number };
}

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  trialing:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  inactive:  "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users");
    if (res.status === 403) {
      setError("Accès refusé — cette page est réservée aux administrateurs.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActivation(user: AdminUser) {
    const action = user.subscriptionStatus === "active" ? "deactivate" : "activate";
    setActionLoading(user.id);
    const res = await fetch("/api/admin/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, action }),
    });
    if (res.ok) {
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id
            ? { ...u, subscriptionStatus: action === "activate" ? "active" : "pending" }
            : u
        )
      );
    }
    setActionLoading(null);
  }

  const pending = users.filter(u => u.subscriptionStatus !== "active" && u.role !== "admin");
  const active  = users.filter(u => u.subscriptionStatus === "active");

  return (
    <>
      <TopBar
        title="Administration — Comptes"
        description={`${users.length} comptes · ${pending.length} en attente · ${active.length} actifs`}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Compte</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden sm:table-cell">Statut</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden md:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">Prospects</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {u.role === "admin" && (
                          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-200">{u.name ?? "—"}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border font-medium ${STATUS_STYLE[u.subscriptionStatus] ?? STATUS_STYLE.inactive}`}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-400">{u.plan}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{u._count.prospects}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {u.role !== "admin" && (
                        <Button
                          size="sm"
                          variant={u.subscriptionStatus === "active" ? "outline" : "warm"}
                          className="h-7 text-xs"
                          disabled={actionLoading === u.id}
                          onClick={() => toggleActivation(u)}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : u.subscriptionStatus === "active" ? (
                            <><UserX className="w-3 h-3" />Désactiver</>
                          ) : (
                            <><UserCheck className="w-3 h-3" />Activer</>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
