import { useState } from "react";
export default function Sidebar() {
  const [selectedAlgo, setSelectedAlgo] = useState("keyword");

  // {/* POST /ecommerce/_search OR POST /ecommerce/_msearch -> data.aggregations.product_types.buckets */}
  const dummyProductTypes = [
    { name: "Processor", count: 0 },
    { name: "Notebook", count: 10 },
    { name: "Headphones", count: 137 },
    { name: "Desktop Board", count: 0 },
    { name: "PC", count: 6 },
    { name: "Headset", count: 6 },
    { name: "Workstation", count: 8 },
  ];

  // {/* POST /ecommerce/_search OR POST /ecommerce/_msearch -> data.aggregations.brands.buckets */}
  const dummyBrands = [
    { name: "Sony", count: 42 },
    { name: "Apple", count: 28 },
    { name: "Logitech", count: 15 },
    { name: "Bose", count: 12 },
    { name: "Samsung", count: 9 },
  ];

  return (
    <aside className="w-72 p-4 border-r border-gray-300 overflow-y-auto flex flex-col gap-6">
      {/* Algorithm Picker Section */}
      <div>
        <h3 className="font-bold text-sm mb-2 text-gray-800">Pick your Algo</h3>
        <select
		  aria-label="Pick your Algo"
          value={selectedAlgo}
          onChange={(e) => setSelectedAlgo(e.target.value)}
          className="w-full border border-gray-300 p-1 text-sm rounded bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="keyword">Keyword</option>
          <option value="neural">Neural</option>
          <option value="hybrid">Hybrid</option>
          <option value="ab">AB</option>
          <option value="art_controlled">ART Controlled</option>
          <option value="other_config">Other Config</option>
        </select>

        {/* GET http://localhost:9090/search_configurations */}
        {selectedAlgo === "other_config" && (
          <div className="flex flex-col gap-2 pl-2 mt-3 border-l-2 border-blue-500 animate-fadeIn">
            <h4 className="text-xs font-semibold text-gray-600">
              Select Configuration:
            </h4>
            <select aria-label="Select Configuration" className="border border-gray-300 rounded p-1 text-sm bg-white w-full focus:outline-none focus:border-blue-500">
              <option value="">-- Select a configuration --</option>
              <option value="art_controlled">art_controlled</option>
              <option value="baseline">baseline</option>
              <option value="baseline_title_weight">
                baseline with title weight
              </option>
              <option value="hybrid_search_query">hybrid_search_query</option>
            </select>
          </div>
        )}
      </div>

      {/* Product Types Filter Section */}
      {/* POST /ecommerce/_search OR POST /ecommerce/_msearch -> data.aggregations.product_types.buckets -> doc_count */}
      <div>
        <h3 className="font-bold text-sm mb-3 text-gray-800">
          Filter by Product Types
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
          {dummyProductTypes.map((filter, idx) => (
            <label
              key={`type-${idx}`}
              className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:bg-gray-50 py-1 rounded"
            >
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="truncate max-w-35">{filter.name}</span>
              </div>
              <span className="text-gray-400 text-xs">{filter.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands Filter Section */}
      {/* POST /ecommerce/_search OR POST /ecommerce/_msearch -> data.aggregations.brands.buckets -> doc_count */}
      <div>
        <h3 className="font-bold text-sm mb-3 text-gray-800">
          Filter by Brands
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
          {dummyBrands.map((brand, idx) => (
            <label
              key={`brand-${idx}`}
              className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:bg-gray-50 py-1 rounded"
            >
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="truncate max-w-35">{brand.name}</span>
              </div>
              <span className="text-gray-400 text-xs">{brand.count}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
