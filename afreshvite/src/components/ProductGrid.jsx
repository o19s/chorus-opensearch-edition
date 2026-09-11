import ProductCard from "./ProductCard";
import Pagination from "./Pagination";

const dummyProducts = Array.from({ length: 20 }).map((_, i) => ({
  id: `prod-${i}`,
  title: `Sample Product Title ${i + 1} - High Quality Headphones`,
  price: (Math.random() * 100).toFixed(2),
  brand: "Dummy Brand",
}));

export default function ProductGrid() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 flex-1 overflow-y-auto pb-4 pr-2 content-start">
        {dummyProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            rank={index}
            title={product.title}
            price={product.price}
            brand={product.brand}
          />
        ))}
      </div>

      <div className="py-2 mt-auto bg-white border-t border-gray-100">
        <Pagination />
      </div>
    </div>
  );
}
