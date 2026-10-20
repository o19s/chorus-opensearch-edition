// src/ShoppingCartButton.js
import React, { useEffect, useState } from 'react';

function ShoppingCartButton() {
  const [buttonValue, setButtonValue] = useState('Loading...');

  const updateButtonValue = () => {
    const cartValue = sessionStorage.getItem("shopping_cart");
    setButtonValue(cartValue ? cartValue : 'No items in cart');
  };

  useEffect(() => {
    // Update the button value on component mount
    updateButtonValue();

    // Listen for cross-tab storage events
    window.addEventListener('storage', updateButtonValue);
    
    //Listen for same-tab custom events triggered by addToCart
    window.addEventListener('cart_updated', updateButtonValue);

    // Cleanup the event listeners on component unmount
    return () => {
      window.removeEventListener('storage', updateButtonValue);
      window.removeEventListener('cart_updated', updateButtonValue);
    };
  }, []);

  //Fetch the saved items array and display it
  const handleCartClick = () => {
    const cartItems = JSON.parse(sessionStorage.getItem("shopping_cart_items") || "[]");
    
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
    } else {
      // Map over the items to create a readable, numbered list
      const itemList = cartItems
        .map((item, index) => `${index + 1}. ${item.title || item.id} ($${item.price || 'N/A'})`)
        .join('\n');
        
      alert(`🛒 Items in your cart:\n\n${itemList}`);
    }
  };

  return (
    <button id="cart" onClick={handleCartClick}>
      {buttonValue}
    </button>
  );
}

export default ShoppingCartButton;