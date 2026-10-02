"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";
  const isMaster = user && (user.email === "zh@gmail.com" || user.email === "admin@unmaskpeople.in" || user.email.toLowerCase().startsWith("admin@") || user.role === "ADMIN");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (!isLoginPage) router.push("/admin/login");
      } else if (!isMaster && user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, loading, router, isLoginPage, isMaster]);

  // If on login page, render login page directly without admin sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
