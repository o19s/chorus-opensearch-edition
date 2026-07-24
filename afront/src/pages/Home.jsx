import { useEffect } from "react";
import logo from "../assets/chorus-logo.png";
import Sidebar from "../components/layout/Sidebar";
import { useStore } from "../store/useStore";

export default function Home() {
  const {
    clientId,
    sessionId,
    searchQuery,
    setSearchQuery,
    executeSearch,
    totalResults,
    results,
    isLoading,
    trackClick,
  } = useStore();

  //initial fetch

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-gray-900 font-sans">
      <header className="flex items-start p-6 gap-14 border-b border-gray-200">
        <div className="w-72 shrink-0 flex justify-center">
          <img src={logo} alt="Chorus" className="h-24 w-auto object-contain" />
        </div>
        <div className="flex-1 flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-2xl">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                placeholder="Search for products, brands or EAN"
                className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {isLoading ? "Searching..." : `${totalResults} results found`}
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-gray-500 flex flex-col items-end gap-1 ml-4">
            <p>Your Client ID: {clientId}</p>
            <p>Your Session ID: {sessionId}</p>
            <div className="flex items-center gap-2 mt-1">
              <span>Your 🛒 Items:</span>
              <span className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">
                No items in cart
                <main className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-lg pt-4 px-4 pb-2 shadow-sm bg-gray-50 min-h-0"></main>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0 pl-6 pt-1 pr-1 pb-1 gap-14">
        <aside className="w-full md:w-72 shrink-0 h-full overflow-y-auto pr-2 custom-scrollbar">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden border border-gray-200 rounded-lg pt-4 px-4 pb-2 shadow-sm bg-gray-50">
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((item, index) => (
                <div
                  key={item._id}
                  className="border p-4 rounded shadow-sm bg-white flex flex-col"
                >
                  {item._source.image && (
                    <img
                      src={item._source.image}
                      alt="product"
                      className="h-40 object-cover mb-4"
                    />
                  )}
                  <h3
                    className="text-sm font-medium flex-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: item._source.title }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {item._source.price} $ | {item._source.Brand || ""}
                  </div>
                  <button
                    onClick={() => trackClick("click", item._id, index)}
                    className="mt-3 w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 py-1 text-sm rounded transition-colors"
                  >
                    Add to 🛒 | rank: {index}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 mt-2 flex justify-center border-t border-gray-200 pt-3 pb-2 text-sm text-gray-400">
            Pagination Placeholder
          </div>
        </main>
      </div>
    </div>
  );
}
