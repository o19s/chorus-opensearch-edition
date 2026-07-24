import { create } from "zustand";
import { UbiClient, UbiQueryRequest } from "../utils/ubi";
import { searchProducts } from "../services/api";

function generateGuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        c ^
        ((crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c / 4))
      ).toString(16),
    );
  }
}

const initialClientId =
  sessionStorage.getItem("client_id") || "CLIENT-" + generateGuid();
sessionStorage.setItem("client_id", initialClientId);

const event_server = "http://localhost:9090";
const ubiClient = new UbiClient(event_server);

export const useStore = create((set, get) => ({
  clientId: initialClientId,
  queryId: null,
  searchQuery: "",
  results: [],
  aggregations: {},
  totalResults: 0,
  isLoading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  executeSearch: async () => {
    set({ isLoading: true });

    const newQueryId = generateGuid();
    sessionStorage.setItem("query_id", newQueryId);
    set({ queryId: newQueryId });

    const { searchQuery, clientId } = get();

    const queryBlock =
      searchQuery.trim() !== ""
        ? {
            multi_match: {
              query: searchQuery,
              fields: [
                "id",
                "title",
                "category",
                "bullets",
                "description",
                "Brand",
                "Color",
              ],
            },
          }
        : { match_all: {} };

    const payload = {
      size: 20,
      query: queryBlock,
      aggs: {
        product_types: { terms: { field: "category_filter", size: 20 } },
        brands: { terms: { field: "Brand.keyword", size: 20 } },
      },
      ext: {
        ubi: {
          query_id: newQueryId,
          user_query: searchQuery,
          client_id: clientId,
          object_id_field: "asin",
          application: "Chorus",
        },
      },
    };

    try {
      const data = await searchProducts(payload);

      set({
        results: data.hits?.hits || [],
        totalResults: data.hits?.total?.value || 0,
        aggregations: data.aggregations || {},
        isLoading: false,
      });

      // Fire the UBI Query log for the first render and subsequent searches
      const ubiQuery = new UbiQueryRequest(
        "Chorus",
        clientId,
        newQueryId,
        searchQuery,
        "asin",
      );
      ubiClient.trackQuery(ubiQuery);
    } catch (error) {
      console.error("Search failed:", error);
      set({ isLoading: false });
    }
  },
}));
