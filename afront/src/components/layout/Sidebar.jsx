import { useStore } from "../../store/useStore";

export default function Sidebar() {
  const { aggregations } = useStore();
  const productTypes = aggregations?.product_types?.buckets || [];

  return (
    <div className="flex flex-col gap-6 w-full pr-2 select-none">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-sm text-gray-800">Pick your Algo</h3>
        <select className="border border-gray-300 rounded p-1 text-sm bg-white w-full max-w-37.5">
          <option value="default">Keyword</option>
          <option value="neural">Neural</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-sm text-gray-800">
          Filter by Product Types
        </h3>
        <div className="flex flex-col pr-1 max-h-96 overflow-y-auto border border-transparent custom-scrollbar">
          {productTypes.map((bucket, index) => (
            <label
              key={index}
              className="flex items-center justify-between w-full text-sm text-gray-700 cursor-pointer py-1 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-0"
                  defaultChecked={false}
                />
                <span className="truncate max-w-40" title={bucket.key}>
                  {bucket.key}
                </span>
              </div>
              <span className="text-gray-400 text-right pr-1 text-xs">
                {bucket.doc_count}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
