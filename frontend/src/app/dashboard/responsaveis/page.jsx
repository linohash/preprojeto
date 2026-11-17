import ResourcePanel from "../../../components/ResourcePanel.jsx";
import styles from "../resourcePages.module.css";

export default function Responsibles() {
  return (
    <div className={styles.stack}>
      <ResourcePanel
        title="Responsáveis"
        endpoint="/usuarios"
        editable
        deletable
        columns={[
          { key: "id_usuario", label: "ID" },
          { key: "nome", label: "NOME" },
          { key: "perfil", label: "PERFIL" },
          { key: "ativo", label: "SITUAÇÃO", format: "active" },
        ]}
        createFields={[
          { name: "nome", label: "Nome" },
          { name: "email", label: "Email", type: "email" },
          { name: "senha", label: "Senha", type: "password", minLength: 8 },
          { name: "descricao", label: "Perfil", type: "select", options: [
            { value: "Técnico", label: "Técnico" },
            { value: "Gestor", label: "Gestor" },
            { value: "Administrador", label: "Administrador" },
          ] },
        ]}
        editFields={[
          { name: "nome", label: "Nome" },
          { name: "email", label: "Email", type: "email" },
          { name: "senha", label: "Nova senha (opcional)", type: "password", minLength: 8, required: false },
          { name: "descricao", label: "Perfil", type: "select", options: [
            { value: "Técnico", label: "Técnico" },
            { value: "Gestor", label: "Gestor" },
            { value: "Administrador", label: "Administrador" },
          ] },
        ]}
      />
    </div>
  );
}
