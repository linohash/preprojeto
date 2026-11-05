module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }

  // Validação real do JWT comentada por falta de tempo na sprint atual
  // jwt.verify(token, process.env.SECRET, (err, decoded) => { ... })

  // Hardcoding um usuário genérico para testes de UI
  req.userId = 1;
  next();
};
