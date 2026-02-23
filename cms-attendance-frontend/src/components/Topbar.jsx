const Topbar = () => {
  const name = localStorage.getItem("firstName");

  return (
    <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      
      <h1 className="text-xl font-semibold text-gray-800">
        Welcome, {name}
      </h1>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>

    </div>
  );
};

export default Topbar;
