### Frontend for Chorus based on Reactivesearch

The frontend was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Step-by-step guide available at [ReactiveSearch Quickstart Doc](https://docs.appbase.io/docs/reactivesearch/v3/overview/quickstart/).

### Configure

The ReactiveSearch components code resides in `src/App.js` file.   
1. The following standard components from ReactiveSearch are used:
 - **ReactiveBase** - ReactiveBase is the provider component that connects the UI with the backend app (OpenSearch). 
 - **DataSearch** - DataSearch component provides a search box UI.
 - **ResultCard** - ResultCard component is used for displaying the **hits** as a card layout.
 - **MultiList** - MultiList component is used to display facets and filter on these.

2. In `src/custom` we have some custom components:
 - **AlgoPicker** - A picker for the specific relevance algorithm ised in the front end.
 - **ShoppingCartButton** - Manage the state of the Shopping Cart icon in the UI with the number of items in the cart.
 
3. In `src/ubi` we have the UBI specific components:
 - **UbiEvent** - Represents the event, and is tied to the specific UBI specification supported.
 - **UbiEventAttributes** - Represents the required and free form attibutes of a specific event.
 - **UbiClient** - Simple client that logs UbiEvent's to the backend.
