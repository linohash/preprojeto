"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../lib/api.js";
import styles from "./AppShell.module.css";

const primary = [
  ["▦", "Dashboard", "/dashboard"],
  ["⚑", "Ocorrências", "/dashboard/ocorrencias"],
  ["＋", "Nova ocorrência", "/dashboard/nova-ocorrencia"],
  ["▤", "Setores e máquinas", "/dashboard/setores-maquinas"],
  ["♙", "Responsáveis", "/dashboard/responsaveis"],
  ["⌁", "Indicadores", "/dashboard/indicadores"],
  ["▧", "Relatórios", "/dashboard/relatorios"],
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [count, setCount] = useState(null);
  const [server, setServer] = useState("checking");
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    let live = true;
    const refresh = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          cache: "no-store",
        });
        const health = await response.json();
        if (live)
          setServer(
            response.ok && health.status === "ok" ? "online" : "offline",
          );
      } catch {
        if (live) setServer("offline");
      }
      const token = window.localStorage.getItem("industri-alert-token");
      const stored = window.localStorage.getItem("industri-alert-user");
      if (live && stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch {
          window.localStorage.removeItem("industri-alert-user");
        }
      }
      if (token) {
        try {
          const rows = await apiFetch("/ocorrencias");
          if (live)
            setCount(
              rows.filter(
                (row) => !["Resolvida", "Cancelada"].includes(row.status),
              ).length,
            );
        } catch {
          if (live) setCount(null);
        }
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);
  const logout = () => {
    window.localStorage.removeItem("industri-alert-token");
    window.localStorage.removeItem("industri-alert-user");
    setProfile(null);
    setCount(null);
    router.push("/login");
  };
  const navItems = (items) =>
    items.map(([icon, title, href]) => (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`${styles.navItem} ${pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? styles.active : ""}`}
      >
        <span className={styles.navIcon}>{icon}</span>
        <span>{title}</span>
        {title === "Ocorrências" && count !== null && (
          <b className={styles.badge}>{count}</b>
        )}
      </Link>
    ));
  return (
    <div className={styles.frame}>
      <button
        aria-label="Abrir navegação"
        className={styles.menuToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ☰
      </button>
      {mobileOpen && (
        <button
          aria-label="Fechar navegação"
          className={styles.scrim}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
      >
        <Link className={styles.brand} href="/dashboard">
          <span className={styles.brandMark}>⚙</span>
          <span>
            <b>
              Industri<span>Alert</span>
            </b>
            <small>GESTÃO DE OCORRÊNCIAS</small>
          </span>
        </Link>
        <span className={styles.groupLabel}>MENU PRINCIPAL</span>
        <nav>{navItems(primary)}</nav>
        <span className={styles.groupLabel}>SISTEMA</span>
        <nav>
          {navItems([["⚙", "Configurações", "/dashboard/configuracoes"]])}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={`${styles.serverDot} ${styles[server]}`} />
          <span>
            Servidor{" "}
            {server === "online"
              ? "online"
              : server === "offline"
                ? "indisponível"
                : "verificando"}
          </span>
          <small>{profile?.nome || "Acesso de visitante"}</small>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Link href="/">⌂</Link>
            <span>/</span>
            <span>Portal Principal</span>
            <span>/</span>
            <b>
              {primary.find(
                ([, , href]) =>
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href)),
              )?.[1] || "Configurações"}
            </b>
          </div>
          <div className={styles.topActions}>
            {profile ? (
              <>
                <span className={styles.userLabel}>
                  {profile.nome} · {profile.perfil}
                </span>
                <button onClick={logout} className={styles.loginButton}>
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.loginButton}>
                Login / Cadastro
              </Link>
            )}
            <Link
              href="/dashboard/nova-ocorrencia"
              className={styles.newButton}
            >
              <span>＋</span> Nova Ocorrência
            </Link>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
