import chorusLogo from "../assets/chorus-logo.png";
import ShoppingCart from "../components/ShoppingCart";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import ProductGrid from "../components/ProductGrid";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex justify-between items-start p-4 border-b border-gray-300">
        <div className="w-72 flex items-center justify-center">
          <img
            src={chorusLogo}
            alt="Chorus Logo"
            className="h-20 object-contain"
          />
        </div>

        <div className="w-1/2 flex flex-col items-center pt-2">
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>

          {/* POST /ecommerce/_search POST /ecommerce/_msearch response.took response.hits.total.value */}
          <div className="text-center text-xs text-gray-400 mt-2">
            448 results found in 5ms
          </div>
        </div>

        <div className="w-1/4 flex justify-end">
          <ShoppingCart />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-2 overflow-hidden bg-white">
          <div className="h-full flex flex-col">
            <ProductGrid />
          </div>
        </main>
      </div>
    </div>
  );
}
