# Kata 5: Protecting Sensitive Information

You have deployed UBI successfully, and reveling in all the great information that you are collecting on what users are doing.

Then, one of your Vice President's asks, how is our conversion rate doing, and can you tell me what the margin is for the products that users are clicking on.

(Apparently he heard that we are juicing our conversion rate by only showing low margin cheap products, which is pushing down our average order basket size!)

We already know the price of the item, but we don't know what the cost of the items is.  If we started tracking cost then we could calculate the margin and start monitoring that:

### Formula for Margin

`Margin = (Price - Cost) / Price × 100`

However, while we are okay with sharing the price of items with our users, we do NOT want to share the cost of those items, and therefore our margins with them!

What to do?  Every query we make returns a set of product results, and it's all stored in the browser so we can record that information when you make your clicks and other actions for tracking in the `ubi_events` index.

Welcome to the __Panama Canal__.

The idea behind the Panama Canal is that it's a short cut.

"You get part of the key, but not all of it"..   Need something.

You can store sensitive data in a private cache, and then later, when an action happens, look it up and use it to complete the full UBI event dataset that you want to store.

For example, let's store the cost of our mobile phones under the EAN (European Article Number).   EAN is similar to the SKU's that you may be familiar with.

```mermaid
sequenceDiagram
    actor Alice
    Alice ->> API: "I want a mobile phone"
    API ->> SearchEngine: "q=mobile phone"
    SearchEngine ->> API: A QueryId and list of phones with EAN, title, description, image, price and cost 
    API ->> Cache: Store cost using QueryId and EAN as key
    API->> Alice: QueryID and list of phones with title, description,image, price but NO cost
    Alice->> API: "Click iPhone 15 Pro" with QueryId and EAN
    API->> Cache: Retrieve cost using QueryId and EAN as key
    API->> UBI Event Datastore: Store QueryId, EAN, price, cost
```

The key for your data in the cache is a combination of the QueryId and the primary key of your document, in our case we are using EAN.
