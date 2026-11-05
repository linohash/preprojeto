import { Router } from "express";
import { pool } from "../config/database.js";
import { authenticate, allowRoles } from "../middlewares/auth.js";
import { hashPassword } from "../controllers/authController.js";

const configs = {
  setores: { table: "setores", id: "id_setor", fields: ["nome", "ativo"] },
  maquinas: {
    table: "maquinas",
    id: "id_maquina",
    fields: ["nome", "id_setor", "status"],
  },
  usuarios: {
    table: "usuarios",
    id: "id_usuario",
    fields: ["nome", "email", "senha", "descricao", "ativo"],
  },
  "tipos-ocorrencia": {
    table: "tipos_ocorrencia",
    id: "id_tipo",
    fields: ["nome", "ativo"],
  },
};

function resource(config) {
  const router = Router();
  router.use(authenticate);

  router.get("/", async (req, res, next) => {
    try {
      let sql;
      if (config.table === "usuarios")
        sql =
          "SELECT id_usuario,nome,email,descricao,descricao AS perfil,ativo FROM usuarios ORDER BY id_usuario DESC";
      else if (config.table === "maquinas")
        sql =
          "SELECT m.*,(m.status='ativa') AS ativo FROM maquinas m ORDER BY m.id_maquina DESC";
      else sql = `SELECT * FROM ${config.table} ORDER BY ${config.id} DESC`;
      const [rows] = await pool.query(sql);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/",
    allowRoles("Administrador", "Gestor"),
    async (req, res, next) => {
      try {
        const fields = config.fields.filter(
          (key) => req.body[key] !== undefined,
        );
        if (
          !req.body.nome ||
          (config.table === "usuarios" && (!req.body.email || !req.body.senha))
        ) {
          return res
            .status(400)
            .json({ message: "Preencha os campos obrigatórios do cadastro." });
        }
        if (config.table === "usuarios" && String(req.body.senha).length < 8) {
          return res
            .status(400)
            .json({ message: "A senha deve ter pelo menos 8 caracteres." });
        }
        if (config.table === "maquinas" && !req.body.id_setor)
          return res
            .status(400)
            .json({ message: "Selecione o setor da máquina." });
        if (config.table === "maquinas" && !fields.includes("status")) {
          fields.push("status");
          req.body.status = "ativa";
        }
        if (config.table === "usuarios" && !fields.includes("descricao")) {
          fields.push("descricao");
          req.body.descricao = "Técnico";
        }
        const values = fields.map((key) =>
          key === "senha" ? hashPassword(String(req.body[key])) : req.body[key],
        );
        const [result] = await pool.execute(
          `INSERT INTO ${config.table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
          values,
        );
        res.status(201).json({ [config.id]: result.insertId });
      } catch (error) {
        next(error);
      }
    },
  );

  const update = async (req, res, next) => {
    try {
      const fields = config.fields.filter((key) => req.body[key] !== undefined);
      if (!fields.length)
        return res
          .status(400)
          .json({ message: "Informe os campos para atualizar." });
      const values = fields.map((key) =>
        key === "senha" ? hashPassword(String(req.body[key])) : req.body[key],
      );
      const [result] = await pool.execute(
        `UPDATE ${config.table} SET ${fields.map((key) => `${key}=?`).join(",")} WHERE ${config.id}=?`,
        [...values, req.params.id],
      );
      if (!result.affectedRows)
        return res.status(404).json({ message: "Registro não encontrado." });
      res.json({ message: "Cadastro atualizado." });
    } catch (error) {
      next(error);
    }
  };

  router.patch("/:id", allowRoles("Administrador", "Gestor"), update);
  router.put("/:id", allowRoles("Administrador", "Gestor"), update);
  router.delete("/:id", allowRoles("Administrador"), async (req, res, next) => {
    try {
      const [result] =
        config.table === "maquinas"
          ? await pool.execute(
              "UPDATE maquinas SET status='inativa' WHERE id_maquina=?",
              [req.params.id],
            )
          : await pool.execute(
              `UPDATE ${config.table} SET ativo=0 WHERE ${config.id}=?`,
              [req.params.id],
            );
      if (!result.affectedRows)
        return res.status(404).json({ message: "Registro não encontrado." });
      res.json({ message: "Cadastro desativado." });
    } catch (error) {
      next(error);
    }
  });
  return router;
}

export const setoresRoutes = resource(configs.setores);
export const maquinasRoutes = resource(configs.maquinas);
export const usuariosRoutes = resource(configs.usuarios);
export const tiposRoutes = resource(configs["tipos-ocorrencia"]);
