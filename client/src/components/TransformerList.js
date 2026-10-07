import { useNavigate } from "react-router-dom";

function TransformerList() {
  const navigate = useNavigate();

  const transformers = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Transformer Monitoring Dashboard
      </h1>

      <div className="grid grid-cols-5 gap-6">
        {transformers.map((id) => (
          <div
            key={id}
            onClick={() => navigate(`/transformer/${id}`)}
            className="bg-white shadow-md rounded-xl p-6 text-center cursor-pointer hover:bg-blue-100 transition"
          >
            <h2 className="text-xl font-semibold">
              Transformer {id}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransformerList;