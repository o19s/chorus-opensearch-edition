import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addToCart } from './App';
import ShoppingCartButton from './custom/ShoppingCartButton';
import chorusLogo from './assets/chorus-logo.png';
import { search_server } from './App';
export default function ProductDetail() {
  const { asin } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${search_server}/ecommerce/_search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
			_source: { excludes: ["cost"] },
            query: { match: { asin: asin } },
            size: 1
          })
        });
        
        const data = await response.json();
        if (data.hits && data.hits.hits.length > 0) {
          setProduct(data.hits.hits[0]._source);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError("Error loading product details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [asin]);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading product...</div>;
  if (error) return <div style={{ padding: "50px", textAlign: "center", color: "red" }}>{error}</div>;
  if (!product) return null;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <Link to="/">
          <img style={{ height: "60px" }} src={chorusLogo} alt="Chorus" />
        </Link>
        <div style={{ textAlign: "right" }}>
          <small>
            <code>Your <span style={{fontSize:24 }}>🛒</span> Items: <ShoppingCartButton/></code>
          </small>
        </div>
      </div>

      <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
        <div style={{ flex: "0 0 400px" }}>
          <img src={product.image} alt={product.title} style={{ width: "100%", borderRadius: "8px" }} />
        </div>
        
        <div style={{ flex: "1" }}>
          <div style={{ color: "#007185", fontWeight: "bold", marginBottom: "10px" }}>
            {product.brand} | {product.category}
          </div>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>{product.title}</h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ fontSize: "20px", color: "#FFA41C" }}>
              {'★'.repeat(Math.round(product.rating || 0))}{'☆'.repeat(5 - Math.round(product.rating || 0))}
            </span>
            <span style={{ color: "#007185" }}>{product.rating_count || 0} ratings</span>
          </div>
          
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "30px" }}>
            ${product.price}
          </div>

          <button 
            style={{ 
              backgroundColor: "#FFD814", borderColor: "#FCD200", borderRadius: "100px", 
              padding: "10px 20px", cursor: "pointer", fontSize: "16px", marginBottom: "40px" 
            }}
            onClick={() => addToCart({ ...product, id: product.id || product.asin , asin: product.asin })}
          >
            Add to Cart 
          </button>

          {product.bullet_points && (
            <div>
              <h3>About this item</h3>
              <ul style={{ lineHeight: "1.6" }}>
                {product.bullet_points.split('\n').map((bullet, i) => bullet.trim() && <li key={i}>{bullet}</li>)}
              </ul>
            </div>
          )}

          {product.description && (
            <div style={{ marginTop: "30px" }}>
              <h3>Product Description</h3>
              <p style={{ lineHeight: "1.6" }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}