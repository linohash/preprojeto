import React from "react";

export default function OcorrenciasPage() {
  // Simulação de dados crus (sem paginação real ou filtros funcionais)
  const ocorrencias = [
    { id: 1, titulo: "Falha no motor principal", status: "Pendente" },
    { id: 2, titulo: "Vazamento de óleo", status: "Em andamento" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Lista de Ocorrências</h1>
      <div className="mb-4 p-4 bg-gray-100 rounded text-sm text-gray-600">
        Filtros temporariamente desativados - Backend V0.1
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Título</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {ocorrencias.map((o) => (
            <tr key={o.id}>
              <td className="py-2 px-4 border-b">{o.id}</td>
              <td className="py-2 px-4 border-b">{o.titulo}</td>
              <td className="py-2 px-4 border-b">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
