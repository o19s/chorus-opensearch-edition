# Kata 001: Alice needs a new Laptop!

Alice just started a new job on the ecommerce team at Chorus Electronics.  A perk of the job is that she can select any laptop computer they sell to use for work.   So off she goes to their website to pick out her perfect laptop computer.

She brings up the website, at http://localhost:4000, and she knows that she needs a laptop style computer, but doesn't have a specific type or brand in mind, so she searches for `notebook`.   Uh oh!  The first set of results are all accessories for a laptop computer, not the laptop itself.   

Now those of us in the search business suspect that this is the classic accessories problem!  She chooses from the "Filter by Product Type" set of options the "Notebook" filter, and is immediately rewarded with just laptop computers.  She picks the third laptop shown, a _HP EliteBook 2530p Notebook_ to add to her cart (by double clicking the product image).

We now have a signal from Alice that when she searches for first "notebook" and then picks a option from Filter by Product Type that our query "notebook" is underperforming as it requires additional filtering to be applied before reasonable products are returned.

Alice is curious, the behavior that she was exhibiting, how are we capturing that?  She knows we have the OpenSearch _User Behavior Insights_ feature enabled, so there should be data in the backend showing her exact journey.

She opens up the OpenSearch Dashboard at http://localhost:5601/app/observability-notebooks and creates a new Notebook.  

She grabs her user_id from the Chorus website, and then creates a SQL query:

```
%sql
SELECT query_id, message_type, action_name, event_attributes, message, timestamp FROM .ubi_log_events WHERE user_id='USER-eeed-43de-959d-90e6040e84f9' ORDER BY timestamp DESC
```

She can now see the set of _on_search_ events generated by typing `notebook`, and then a series of _product_hover_ events from mousing over the various products.

Then, there is a _global_click_ from picking the facet.  FIXME.   And finally, with the actual laptops showing up, she can see that the _add_to_cart_ event when she added the _HP EliteBook_ to her shopping cart!


> [!TIP]  
> If we only looked at the Server side Events, we would not know that the search for notebook and then the follow up filtering choice are connected events.