const StatCard = ({ title, value, color }) => {
  return (
    <div className={`bg-white shadow-md rounded-xl p-6 border-l-4 ${color}`}>
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
    </div>
  );
};

export default StatCard;
