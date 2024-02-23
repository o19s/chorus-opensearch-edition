# Kata 001: Alice needs a new Laptop!

Alice needs a new laptop!  And where does she go shopping for electronics, her favorite website, Chorus Electronics.   

She brings up the website, at http://localhost:4000, and she knows what she wants, a laptop, but doesn't have a specific make or model in mind, so she searches for `laptop`.   Uh oh!   She’s got nothing but laptop bags.... 

Now those of us in the search business know that this is the classic accessories problem!

Option A --> She immediately refines to product_type laptop.   We don’t have this for today.

Option B --> She is frustrated with what is being shown, but she loves shopping at Chorus so she tries Notebook...   And while the results aren’t great, she does see notebooks starting at rank #9 and filling the THIRD row of results.   She mouses over the various laptops on the third row and clicks a laptop “Quick View” to pop open the detail.  <-- We do not yet have this button.

We now have a signal from Alice that when she searches for first “laptop” and then “notebook” and clicks on what we would all consider a laptop computer, that is in Rank 9, that we are showing underperforming documents above, and that our relevancy is bad.

If we only looked at the Server side Events, we would not know that the search for laptop and then notebook, were connected, and that notebook and result 9 are connected....  This data here lets you think about building a click model...!

So now let’s look at the events that we saw happening in this communication.  Here we can see the basic event happening in the browser:



Now, let’s go look at this data in the backend.  We can actually do a curl command:
curl "localhost:9200/.ubl_log_queries/_search?size=100" | jq





We can also look at the data in Dev Tools:

http://localhost:5601/app/dev_tools#/console

GET /.ubl_log_queries/_search
{
  "query": {
    "match_all": {}
  }
}

http://localhost:5601/app/observability-notebooks#/7W9W1o0BHx42AElNA4mi?view=view_both 
source=.ubl_log_events | where user_id = 'fake user id' | fields query_id, action_name

Stavros, one reason our “session_id” is fake session id, is because we really need to figure out if Session is a concept that makes sense in UBL or is using “session” misleading.  Maybe what we really need is a “client_id” that is persistent and passed in, and a “query_text”....

Stavros, we have actually populating placeholders ready to merge, but didn’t want to bust the demo.

Alos, we may not want the full query as raw_query


So now, let’s look at the events related to this query.    Let’s bring up the Dashboard....  

We currently are logging queries and events INDEPENDENTLY, and will soon have the query_id figured out to link them....



Select * from .ubl_log_events limit 100;


And for our last bit, let’s show that we are starting to track some of the changes that a user makes on the front end.  Here is Alice changing her algorithm......    And if we look in the console, we see these event changes…

{"action_name":"algo_change","user_id":"user123","query_id":"","message_type":"INFO","message":"Algorithm changed to undefined","event_attributes":{}}

select * from .ubl_log_events where action_name = 'algo_change' and user_id = 'user123'
