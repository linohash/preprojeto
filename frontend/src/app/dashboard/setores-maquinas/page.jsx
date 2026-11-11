import ResourcePanel from "../../../components/ResourcePanel.jsx";
import styles from "../resourcePages.module.css";

export default function SectorsMachines() {
  return (
    <div className={styles.stack}>
      <ResourcePanel
        title="Setores"
        endpoint="/setores"
        columns={[
          { key: "id_setor", label: "ID" },
          { key: "nome", label: "NOME DO SETOR" },
          { key: "ativo", label: "SITUAÇÃO", format: "active" },
        ]}
        createFields={[{ name: "nome", label: "Nome do setor" }]}
      />
      <ResourcePanel
        title="Máquinas"
        endpoint="/maquinas"
        columns={[
          { key: "id_maquina", label: "ID" },
          { key: "nome", label: "MÁQUINA" },
          { key: "id_setor", label: "ID DO SETOR" },
          { key: "ativo", label: "SITUAÇÃO", format: "active" },
        ]}
        createFields={[
          { name: "nome", label: "Nome da máquina" },
          {
            name: "id_setor",
            label: "Setor",
            type: "related",
            endpoint: "/setores",
            valueKey: "id_setor",
            labelKey: "nome",
          },
        ]}
      />
      <ResourcePanel
        title="Tipos de ocorrência"
        endpoint="/tipos-ocorrencia"
        columns={[
          { key: "id_tipo", label: "ID" },
          { key: "nome", label: "TIPO" },
          { key: "ativo", label: "SITUAÇÃO", format: "active" },
        ]}
        createFields={[{ name: "nome", label: "Nome do tipo" }]}
      />
    </div>
  );
}
