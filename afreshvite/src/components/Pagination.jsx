export default function Pagination() {
  return (
    <div className="mt-8 flex justify-center space-x-2 text-sm">
      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer">
        Previous
      </button>
      <button className="px-3 py-1 border rounded bg-blue-50 text-blue-600 font-bold cursor-pointer">
        1
      </button>
      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer">
        2
      </button>
      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer">
        3
      </button>
      <span className="px-3 py-1 text-gray-400">...</span>
      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer">
        10
      </button>
      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer">
        Next
      </button>
    </div>
  );
}
