import { Search } from "lucide-react";

export default function SearchBar() {
  {
    /* ID Generation: On every keypress, it must generate a new `query_id` and save it to sessionStorage. This links all subsequent clicks to this specific search.
		2. Telemetry onvaluechange -> UBI event (message_type: 'QUERY') and sends a POST request to middleware endpoint: `http://localhost:9090/ubi_events`.
  		3. Fetch Products: It debounces the input, reads the selected algorithm (keyword, neural, etc.) from state, constructs the OpenSearch JSON payload 
		(including the `ext: { ubi: {...} }` object), and sends a POST request to `http://localhost:9090/ecommerce/_msearch` to render the new product grid.
	*/
  }
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} className="text-blue-500" />
      </div>
      <input
        type="text"
        placeholder="Search for products, brands or ASIN"
        className="w-full border border-gray-300 rounded py-2 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}
