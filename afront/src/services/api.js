const API_BASE_URL = "http://localhost:9090";

export const searchProducts = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ecommerce/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Search Error:", error);
    throw error;
  }
};
