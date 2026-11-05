exports.getDashboardStats = async (req, res) => {
  // TODO: Conectar com o banco de dados real na Sprint 3
  // Retornando mock temporário para o frontend montar o layout
  return res.json({
    totalOcorrencias: 42,
    resolvidas: 12,
    pendentes: 30,
    mensagem: "Dados mockados (Backend incompleto)",
  });
};
