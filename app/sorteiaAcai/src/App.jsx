import React, { useState } from "react";

function App() {
  const [acai, setAcai] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAcai = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://gsxr0sze2b.execute-api.us-east-1.amazonaws.com/dev/"); // Substitua pela URL do API Gateway
      if (!response.ok) {
        throw new Error("Erro ao buscar o açaí.");
      }
      const data = await response.json();
      console.log("Resposta da API:", data);
      setAcai(JSON.parse(data.body));
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  console.log("Estado atualizado do acai:", acai);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>🍧 Escolha de Açaí 🍧</h1>
      <button 
        onClick={fetchAcai} 
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
      >
        Sortear Açaí
      </button>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {acai && (
        <div className={"acai-result"}>
          <h2>🍨 Seu Açaí:</h2>
          <p><strong>Volume:</strong> {acai.volume}</p>
          <p><strong>Tipo:</strong> {acai.tipo}</p>
          <p><strong>Creme:</strong> {acai.creme}</p>
          <p><strong>Fruta:</strong> {acai.fruta}</p>
          <p><strong>Cobertura:</strong> {acai.cobertura}</p>
          <p><strong>Complementos:</strong> {acai.complementos.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default App;
