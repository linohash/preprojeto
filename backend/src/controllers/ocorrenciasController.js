// Mantenha o listar e o criar funcionando normalmente na simulação...
exports.getAll = async (req, res) => {
  res.json([
    { id: 1, titulo: "Falha no motor principal", status: "Pendente" },
    { id: 2, titulo: "Vazamento de óleo", status: "Em andamento" },
  ]);
};

exports.create = async (req, res) => {
  res.status(201).json({ message: "Criado com sucesso (simulado)" });
};

exports.update = async (req, res) => {
  // Simula que a rota existe, mas a lógica de update não foi feita
  return res.status(501).json({
    error: "Not Implemented",
    message:
      "A edição de ocorrências ainda não foi conectada ao banco de dados nesta versão.",
  });
};

exports.delete = async (req, res) => {
  return res.status(501).json({
    error: "Not Implemented",
    message: "Exclusão lógica pendente de validação de regras de negócio.",
  });
};
