export default function RelatoriosPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Relatórios e Exportações</h1>
      <div
        className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
        role="alert"
      >
        <p className="font-bold">Em Desenvolvimento</p>
        <p>
          A geração de relatórios em PDF/Excel será implementada na próxima
          sprint. O backend ainda não suporta esta rota.
        </p>
      </div>
      <button
        disabled
        className="mt-4 bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
      >
        Exportar PDF
      </button>
    </div>
  );
}
