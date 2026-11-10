import ResourcePanel from "../../../components/ResourcePanel.jsx";
import styles from "../resourcePages.module.css";

export default function Responsibles(){return <div className={styles.stack}><ResourcePanel title="Responsáveis" endpoint="/usuarios" columns={[{key:"id_usuario",label:"ID"},{key:"nome",label:"NOME"},{key:"perfil",label:"PERFIL"},{key:"ativo",label:"SITUAÇÃO",format:"active"}]}/></div>}
