"use client";

import { useEffect,useState } from "react";
import { API_URL } from "../../../lib/api.js";
import styles from "./settings.module.css";

export default function Settings(){const [user,setUser]=useState(null);useEffect(()=>{Promise.resolve().then(()=>{try{setUser(JSON.parse(localStorage.getItem("industri-alert-user")||"null"));}catch{setUser(null);}});},[]);return <section className={styles.page}><span className={styles.kicker}>PREFERÊNCIAS DO SISTEMA</span><h1>Configurações</h1><p className={styles.lead}>Informações de acesso e integração deste ambiente.</p><div className={styles.card}><h2>Sessão atual</h2>{user?<dl><div><dt>Usuário</dt><dd>{user.nome}</dd></div><div><dt>E-mail</dt><dd>{user.email}</dd></div><div><dt>Perfil</dt><dd>{user.perfil}</dd></div></dl>:<p>Você está acessando sem uma sessão autenticada. <a href="/login">Entrar →</a></p>}</div><div className={styles.card}><h2>Conexão da plataforma</h2><dl><div><dt>API configurada</dt><dd>{API_URL}</dd></div><div><dt>Estado da conexão</dt><dd>Confira o indicador de servidor no final do menu lateral.</dd></div></dl></div><p className={styles.note}>A URL da API vem de <code>NEXT_PUBLIC_API_URL</code>. Segredos de autenticação permanecem no backend.</p></section>}
