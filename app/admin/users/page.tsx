"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  KeyRound,
  DollarSign,
  Plus,
  Minus,
  RefreshCw,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [walletModalUser, setWalletModalUser] = useState<any>(null);
  const [walletAdjType, setWalletAdjType] = useState<"MANUAL_CREDIT" | "MANUAL_DEBIT">("MANUAL_CREDIT");
  const [walletAdjAmount, setWalletAdjAmount] = useState("");
  const [walletAdjReason, setWalletAdjReason] = useState("");
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  const [passwordModalUser, setPasswordModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const fetchUsers = async (p = page, q = search, st = statusFilter, r = roleFilter) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=${p}&limit=12&query=${encodeURIComponent(q)}&status=${st}&role=${r}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search, statusFilter, roleFilter);
  }, [page, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search, statusFilter, roleFilter);
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to change user status");
      toast.success(
        "Account Status Updated",
        `User ${user.email} is now ${nextStatus}.`
      );
      fetchUsers();
    } catch (err: any) {
      toast.error("Action Failed", err.message);
    }
  };

  const handleToggleRole = async (user: any) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error("Failed to change user role");
      toast.success("Role Changed", `User role set to ${nextRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error("Role Change Failed", err.message);
    }
  };

  const handleWalletAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAdjAmount || Number(walletAdjAmount) <= 0) {
      toast.error("Invalid Amount", "Please enter a valid amount greater than ₹0.");
      return;
    }
    if (!walletAdjReason || walletAdjReason.trim().length < 5) {
      toast.error("Audit Reason Required", "A detailed reason (at least 5 chars) is mandatory.");
      return;
    }

    setWalletSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${walletModalUser.id}/wallet-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: walletAdjType,
          amount: Number(walletAdjAmount),
          reason: walletAdjReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust balance");

      toast.success("Wallet Adjusted", data.message);
      setWalletModalUser(null);
      setWalletAdjAmount("");
      setWalletAdjReason("");
      fetchUsers();
    } catch (err: any) {
      toast.error("Adjustment Failed", err.message);
    } finally {
      setWalletSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Weak Password", "Password must be at least 8 characters.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${passwordModalUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: newPassword }),
      });

      if (!res.ok) throw new Error("Failed to reset password");

      toast.success("Password Reset", `Password updated for ${passwordModalUser.email}`);
      setPasswordModalUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error("Reset Failed", err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Subscriber & User Management"
        subtitle="Manage subscriber access, atomic wallet balances, credentials, and access roles"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subscriber name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Status: Active</option>
              <option value="DISABLED">Status: Disabled</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">Role: All</option>
              <option value="USER">Role: USER</option>
              <option value="ADMIN">Role: ADMIN</option>
            </select>

            <button
              onClick={() => fetchUsers()}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Subscriber</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Wallet Balance</th>
                  <th className="py-3.5 px-4 text-center">Lookups</th>
                  <th className="py-3.5 px-4 text-center">Joined</th>
                  <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm">{u.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border transition-colors ${
                            u.role === "ADMIN"
                              ? "bg-violet-950/60 text-violet-300 border-violet-700/60 hover:bg-violet-900/60"
                              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                          }`}
                          title="Click to toggle role"
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60"
                              : "bg-rose-950/60 text-rose-400 border-rose-800/50 hover:bg-rose-900/60"
                          }`}
                          title="Click to toggle account status"
                        >
                          {u.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{u.status}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                        ₹{Number(u.wallet?.balance ?? 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {u._count?.apiRequests ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Adjust Balance Button */}
                        <button
                          onClick={() => {
                            setWalletModalUser(u);
                            setWalletAdjType("MANUAL_CREDIT");
                            setWalletAdjAmount("");
                            setWalletAdjReason("");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60 font-semibold text-[11px] transition-colors"
                        >
                          Adjust Funds
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setPasswordModalUser(u);
                            setNewPassword("");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Reset Pass
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      {loading ? "Loading subscriber accounts..." : "No users found matching your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950">
              <span>
                Page {page} of {totalPages} ({totalCount} subscribers)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal 1: Wallet Adjustment */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Manual Balance Adjustment</h3>
                <p className="text-xs text-slate-400">Target: {walletModalUser.name} ({walletModalUser.email})</p>
              </div>
              <button
                onClick={() => setWalletModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalletAdjustmentSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₹{Number(walletModalUser.wallet?.balance ?? 0).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletAdjType("MANUAL_CREDIT")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      walletAdjType === "MANUAL_CREDIT"
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Credit Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletAdjType("MANUAL_DEBIT")}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      walletAdjType === "MANUAL_DEBIT"
                        ? "bg-rose-950/60 border-rose-500 text-rose-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" /> Deduct Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={walletAdjAmount}
                  onChange={(e) => setWalletAdjAmount(e.target.value)}
                  placeholder="e.g. 100.00"
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Audit Reason (Mandatory for Compliance)
                </label>
                <textarea
                  rows={2}
                  value={walletAdjReason}
                  onChange={(e) => setWalletAdjReason(e.target.value)}
                  placeholder="e.g. Promotional goodwill bonus / Enterprise manual correction"
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletSubmitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {walletSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Password Reset */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Reset User Password</h3>
                <p className="text-xs text-slate-400">User: {passwordModalUser.email}</p>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Set Temporary / New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="NewSecurePassword123!"
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {passwordSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
