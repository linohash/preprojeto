export function errorHandler(error, request, response, next) {
  console.error(error);
  if (response.headersSent) return next(error);
  if (error.type === "entity.parse.failed")
    return response
      .status(400)
      .json({ message: "O corpo da requisição contém JSON inválido." });
  if (error.type === "entity.too.large")
    return response
      .status(413)
      .json({ message: "A requisição excede o limite permitido." });
  if (error.code === "ER_DUP_ENTRY")
    return response
      .status(409)
      .json({ message: "Já existe um cadastro com esses dados." });
  if (
    [
      "ER_NO_REFERENCED_ROW_2",
      "ER_ROW_IS_REFERENCED_2",
      "ER_BAD_NULL_ERROR",
      "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD",
      "ER_DATA_TOO_LONG",
    ].includes(error.code)
  )
    return response
      .status(400)
      .json({
        message:
          "Os dados informados são inválidos ou estão vinculados a outros registros.",
      });
  response
    .status(500)
    .json({ message: "Erro interno no servidor. Tente novamente mais tarde." });
}
