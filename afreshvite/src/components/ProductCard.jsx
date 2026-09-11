import { ShoppingCart } from "lucide-react";

export default function ProductCard({ rank, title, price, brand }) {
  {
    /* POST /ecommerce/_search POST /ecommerce/_msearch response.hits.hits  */
  }
  return (
    <div className="border border-gray-200 flex flex-col bg-white h-full">
      <div className="flex-1 flex flex-col items-center p-4">
        <div className="w-full h-50 bg-white mb-4 flex items-center justify-center text-gray-300 text-xs">
          [Image]
        </div>

        <h3 className="font-bold text-xs text-center mb-1 line-clamp-2 h-8 text-gray-900">
          {title}
        </h3>

        <div className="text-xs text-gray-500">
          {price} $ | {brand}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button className="w-24 h-8 flex items-center justify-center gap-2 text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-black rounded-md">
            Add to <ShoppingCart size={14} className="text-gray-500" />
          </button>

          <span className="w-24 h-8 flex items-center justify-center text-xs text-black bg-gray-200 rounded-md">
            RANK: {rank}
          </span>
        </div>
      </div>
    </div>
  );
}
