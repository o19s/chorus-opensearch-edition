// src/ShoppingCartButton.js
import React, { useEffect, useState } from 'react';

function ShoppingCartButton() {
  const [buttonValue, setButtonValue] = useState('Loading...');

  // Function to update the button value from sessionStorage
  const updateButtonValue = () => {
    const cartValue = sessionStorage.getItem("shopping_cart");
    setButtonValue(cartValue ? cartValue : 'No items in cart');
  };

  useEffect(() => {
    // Update the button value on component mount
    updateButtonValue();

    // Listen for storage events
    window.addEventListener('storage', updateButtonValue);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('storage', updateButtonValue);
    };
  }, []);

  return (
    <button id="cart" onClick ={
      function(results) {
        alert("Maybe someday I'll show you what's in your cart!");
      }}>
      {buttonValue}
    </button>
  );
}

export default ShoppingCartButton;
