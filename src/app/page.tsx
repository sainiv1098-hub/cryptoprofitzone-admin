"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FiCheck, FiX, FiLogOut } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface Admin {
  email: string;
  role: string;
  name: string;
}

interface RequestItem {
  id: string;
  userId: string;
  amount: string;
  status: string;
  type?: string;
  paymentMethod?: string;
  createdAt: string;
  userName: string | null;
  userPhone: string | null;
}

type Tab = "deposits" | "withdrawals" | "sec-deposits" | "sec-withdrawals";

function AdminApp() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("deposits");
  const [data, setData] = useState<RequestItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      verifyToken(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    const endpoints: Record<Tab, string> = {
      deposits: "/admin/deposit-requests?status=pending",
      withdrawals: "/admin/withdrawal-requests?status=pending",
      "sec-deposits": "/admin/security-deposits?status=pending",
      "sec-withdrawals": "/admin/security-withdrawals?status=pending",
    };

    try {
      const res = await fetch(`${API_URL}${endpoints[tab]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [token, tab]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, tab, fetchData]);

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

  async function handleAction(id: string, status: "approved" | "rejected") {
    if (!token) return;
    setActionLoading(id);

    const updateEndpoints: Record<Tab, string> = {
      deposits: "/admin/update-transaction",
      withdrawals: "/admin/update-transaction",
      "sec-deposits": "/admin/update-security-deposit",
      "sec-withdrawals": "/admin/update-security-withdrawal",
    };

    try {
      await fetch(`${API_URL}${updateEndpoints[tab]}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
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
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <h1 className="text-2xl font-bold text-white">
            Abc<span className="text-indigo-400">Pay</span> Admin
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "deposits", label: "Deposit Req" },
    { key: "withdrawals", label: "Withdrawal Req" },
    { key: "sec-deposits", label: "Sec Deposits" },
    { key: "sec-withdrawals", label: "Sec Withdrawals" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-md flex items-center justify-center text-white font-bold text-xs">
            F
          </div>
          <span className="text-lg font-bold text-white">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs hidden sm:block">{admin.email}</span>
          <button onClick={logout} className="text-muted hover:text-white">
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-card-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-white"
                : "border-transparent text-muted hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {fetching ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-muted">No pending requests</div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {data.map((item) => (
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
                  {item.type && (
                    <span className="text-[10px] font-bold border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                      {item.type.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-muted text-[10px] mb-3">
                  {new Date(item.createdAt).toLocaleString()} &bull; {item.id.slice(0, 8)}
                </p>
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
              </div>
            ))}
          </div>
        )}
      </div>
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
