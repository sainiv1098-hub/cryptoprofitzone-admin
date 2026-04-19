"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  FiCheck, FiX, FiLogOut, FiMenu, FiHome, FiHash,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface Admin {
  email: string;
  role: string;
  name: string;
}

type Section = "dashboard" | "requests" | "utrs";

function AdminApp() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      verifyToken(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyToken(t: string) {
    try {
      const res = await fetch(`${API_URL}/admin-auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await res.json();
      if (d.success) {
        setAdmin(d.admin);
      } else {
        localStorage.removeItem("admin_token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("admin_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credential: string) {
    try {
      const res = await fetch(`${API_URL}/admin-auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("admin_token", d.token);
        setToken(d.token);
        setAdmin(d.admin);
      } else {
        alert(d.message || "Login failed");
      }
    } catch {
      alert("Network error");
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAdmin(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/cryptozonelogo.jpeg"
            alt="Crypto Profit Zone"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover"
            priority
          />
          <h1 className="text-2xl font-bold text-white">
            Crypto <span className="text-indigo-400">Profit Zone</span> Admin
          </h1>
        </div>
        <p className="text-muted text-sm">Sign in with your authorized Google account</p>
        <GoogleLogin
          onSuccess={(resp) => resp.credential && handleGoogleLogin(resp.credential)}
          onError={() => alert("Google login failed")}
          theme="filled_blue"
          size="large"
          shape="pill"
        />
      </div>
    );
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <FiHome size={18} /> },
    { key: "requests", label: "Requests", icon: <FiCheck size={18} /> },
    { key: "utrs", label: "UTRs", icon: <FiHash size={18} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 h-full w-60 bg-card-bg border-r border-card-border flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Image
              src="/cryptozonelogo.jpeg"
              alt="Crypto Profit Zone"
              width={28}
              height={28}
              className="w-7 h-7 rounded-md object-cover"
            />
            <span className="text-sm font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSection(item.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm ${
                section === item.key ? "bg-primary/20 text-white" : "text-muted hover:text-white"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-card-border px-4 py-3">
          <p className="text-muted text-[10px] truncate mb-1">{admin.email}</p>
          <button onClick={logout} className="flex items-center gap-2 text-muted text-xs hover:text-white">
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-card-border shrink-0 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <FiMenu size={20} />
          </button>
          <span className="text-white font-semibold text-sm">
            {navItems.find((n) => n.key === section)?.label}
          </span>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {section === "dashboard" && <DashboardSection />}
          {section === "requests" && <RequestsSection token={token} />}
          {section === "utrs" && <UTRsSection token={token} />}
        </div>
      </main>
    </div>
  );
}

function DashboardSection() {
  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-4">Welcome, Admin</h2>
      <p className="text-muted text-sm">Use the sidebar to manage requests and UTRs.</p>
    </div>
  );
}

function RequestsSection({ token }: { token: string }) {
  const [tab, setTab] = useState<"deposits" | "withdrawals" | "sec-deposits" | "sec-withdrawals">("deposits");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setFetching(true);
    const ep: Record<string, string> = {
      deposits: `/admin/deposit-requests?status=${statusFilter}`,
      withdrawals: `/admin/withdrawal-requests?status=${statusFilter}`,
      "sec-deposits": `/admin/security-deposits?status=${statusFilter}`,
      "sec-withdrawals": `/admin/security-withdrawals?status=${statusFilter}`,
    };
    try {
      const res = await fetch(`${API_URL}${ep[tab]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [token, tab, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    const ep: Record<string, string> = {
      deposits: "/admin/update-transaction",
      withdrawals: "/admin/update-transaction",
      "sec-deposits": "/admin/update-security-deposit",
      "sec-withdrawals": "/admin/update-security-withdrawal",
    };
    try {
      await fetch(`${API_URL}${ep[tab]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      setData((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {/* Tab filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {(["deposits", "withdrawals", "sec-deposits", "sec-withdrawals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
              tab === t ? "bg-primary text-white" : "bg-card-bg text-muted border border-card-border"
            }`}
          >
            {t.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap font-medium ${
              statusFilter === s
                ? s === "pending"
                  ? "bg-yellow-500 text-black"
                  : s === "approved"
                  ? "bg-success text-white"
                  : "bg-danger text-white"
                : "bg-card-bg text-muted border border-card-border"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {fetching ? (
        <p className="text-muted">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted">No {statusFilter} requests</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item: any) => (
            <div key={item.id} className="bg-card-bg border border-card-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-bold text-lg">
                    {"\u20B9"}{parseFloat(item.amount).toLocaleString()}
                  </p>
                  <p className="text-muted text-xs">
                    {item.userPhone || "Unknown"} {item.userName ? `(${item.userName})` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.type && (
                    <span className="text-[10px] font-bold border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                      {item.type.toUpperCase()}
                    </span>
                  )}
                  {item.paymentMethod && (
                    <span className="text-[10px] font-bold border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full">
                      {item.paymentMethod.toUpperCase()}
                    </span>
                  )}
                  {statusFilter !== "pending" && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "approved" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                      }`}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Show UTR/TxnID if present (for sec-deposits) */}
              {item.utrNumber && (
                <div className="bg-[#1a2744] border border-card-border rounded-lg px-3 py-2 mb-2">
                  <p className="text-muted text-[10px]">
                    {item.paymentMethod === "bep20" || item.paymentMethod === "trc20" ? "Transaction ID" : "UTR Number"}
                  </p>
                  <p className="text-cyan-400 text-xs font-medium break-all">{item.utrNumber}</p>
                </div>
              )}

              <p className="text-muted text-[10px] mb-3">
                {new Date(item.createdAt).toLocaleString()} &bull; {item.id.slice(0, 8)}
              </p>

              {statusFilter === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approved")}
                    disabled={actionLoading === item.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    <FiCheck size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "rejected")}
                    disabled={actionLoading === item.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-danger text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    <FiX size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UTRsSection({ token }: { token: string }) {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/admin/utrs?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/update-utr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      setData((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <h2 className="text-white font-bold mb-4">UTRs</h2>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap font-medium ${
              statusFilter === s
                ? s === "pending"
                  ? "bg-yellow-500 text-black"
                  : s === "approved"
                  ? "bg-success text-white"
                  : "bg-danger text-white"
                : "bg-card-bg text-muted border border-card-border"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {fetching ? (
        <p className="text-muted">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-muted">No {statusFilter} UTRs</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item: any) => (
            <div key={item.id} className="bg-card-bg border border-card-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-cyan-400 text-sm font-bold">{item.utrNumber}</p>
                  <p className="text-white font-bold text-lg">
                    {"\u20B9"}{parseFloat(item.amount).toLocaleString()}
                  </p>
                  <p className="text-muted text-xs">
                    {item.userPhone || "Unknown"} {item.userName ? `(${item.userName})` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.bankName && (
                    <span className="text-[10px] font-bold border border-card-border text-muted px-2 py-0.5 rounded-full">
                      {item.bankName}
                    </span>
                  )}
                  {statusFilter !== "pending" && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "approved" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                      }`}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted text-[10px] mb-3">
                {new Date(item.createdAt).toLocaleString()} &bull; {item.id.slice(0, 8)}
              </p>

              {statusFilter === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approved")}
                    disabled={actionLoading === item.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    <FiCheck size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "rejected")}
                    disabled={actionLoading === item.id}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-danger text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    <FiX size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AdminApp />
    </GoogleOAuthProvider>
  );
}
