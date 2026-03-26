export default function SearchBar({
  empCodeInput,
  setEmpCodeInput,
  handleSearch,
  handleClear,
  loading
}) {

  return (
    <div>

      <input
        value={empCodeInput}
        onChange={e => setEmpCodeInput(e.target.value)}
        placeholder="Employee Code"
      />

      <button onClick={handleSearch} disabled={loading}>
        Search
      </button>

      <button onClick={handleClear}>
        Clear
      </button>

    </div>
  );
}