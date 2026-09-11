import { ShoppingCart as CartIcon } from "lucide-react";

export default function ShoppingCart() {
  {
    /* 
  - Client ID & Session ID: get from crypto.randomUUID() on initial app load and stored in sessionStorage.
  - Cart Counter: Needs to read/write from sessionStorage.getItem("shopping_cart").
*/
  }
  return (
    <div className="text-right text-xs text-gray-600 font-mono space-y-1">
      <p>Your Client ID: CLIENT-STATIC-1234</p>
      <p>Your Session ID: SESSION-STATIC-5678</p>
      <div className="flex items-center justify-end gap-2 text-sm mt-2">
        <span>Your</span>
        <CartIcon size={16} />
        <span>Items: </span>
        <span className="border px-2 py-1 bg-gray-50 rounded">
          No items in cart
        </span>
      </div>
    </div>
  );
}
