# Kata 002: Lets derive interaction data from UBI

Let's say you're searching for a laptop.  Pop open the Chorus webshop. 
You type "laptop" and unfortuantly you are getting lots of accessories for laptops, like screen protectors.  You want an HP laptop so you click on the HP brand filter, and _Chorus_ suggests a single HP laptop, along with an HP branded accessory.  You know there are more HP laptops available at Chorus however!
Try querying for "pcs" instead and now _Chorus_ is offering you laptop bags!
Try filtering the product type on 'PC'.  Still garbage?  Nope, now we are starting to get HP computers.  However you want a laptop....
Try adding 'Notebook' to the product type.
Finally, you're seeing the types of HP laptops you had in mind, and you buy one by double clicking the image and choosing the OK button!

Now, let's see if we can intuit from the data that UBI collected that this user is someone who likes HP products, if they search for laptop, they want HP branded laptops.  If they search for `pcs` then they want HP branded computers to be returned.

Pop open the dashboard view.  We're going to use the Query Workbench view to look at the data.  http://localhost:5601/app/opensearch-query-workbench#/



Let's see what UBI logged:
```sql
select 
	user_id, query_id, action_name, message_type, message, event_attributes.object.object_type, timestamp 
from ubi_chorus_events e
where e.user_id = 'USER-eeed-43de-959d-90e6040e84f9'
order by timestamp
```

user_id|query_id|action_name|message_type|message
---|---|---|---|---
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(381, 19)|click_location|1712770519665
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|l|NULL|1712770523466
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|la|NULL|1712770523619
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|lap|NULL|1712770523850
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|lapt|NULL|1712770524164
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|lapto|NULL|1712770524691
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|laptop|NULL|1712770525139
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|Targus ASF150EU screen protector Desktop/Laptop Universal (5024442896507)|product|1712770530025
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|Targus ASF150EU screen protector Desktop/Laptop Universal (5024442896507)|product|1712770530034
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(17, 19)|click_location|1712770538873
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770538886
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(12, 9)|click_location|1712770538891
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|Targus ASF150EU screen protector Desktop/Laptop Universal (5024442896507)|product|1712770543043
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(303, 29)|click_location|1712770545665
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|p|NULL|1712770547280
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770547374
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|pc|NULL|1712770547381
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770547460
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|on_search|QUERY|pcs|NULL|1712770547620
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(1, 11)|click_location|1712770550905
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: |filter_data|1712770550912
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(22, 0)|click_location|1712770550919
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(1, 11)|click_location|1712770551833
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770551840
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(22, 0)|click_location|1712770551849
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(14, 14)|click_location|1712770557233
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|type_filter|INFO|filtering on product types: PC|filter_data|1712770557243
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(36, 4)|click_location|1712770557250
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770557315
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(39, 14)|click_location|1712770561657
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|type_filter|INFO|filtering on product types: PC,Notebook|filter_data|1712770561664
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(60, 3)|click_location|1712770561668
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|brand_filter|FILTER|filtering on brands: HP|filter_data|1712770561757
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq dc7900 IntelÂ® ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq dc7900 IntelÂ® ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq dc7800p Intel ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq dc7900 IntelÂ® ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq dc7900 IntelÂ® C...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook Bl...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook Blac...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook Black ...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook Black 35...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|product_hover|INFO|HP Compaq 6530b Notebook Black 35.8...
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(46, 144)|click_location|1712770802492
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|global_click|INFO|(46, 144)|click_location|1712770802764
USER-eeed-43de-959d-90e6040e84f9|63bc508e-f0d3-4de4-9e8d-ae4450be6177|add_to_cart|CONVERSION|HP Compaq 6530b Notebook Black 35.8 cm (14.1") 1280 x 800 pixels IntelÂ® Coreâ„¢2 Duo 2 GB DDR2-SDRAM 320 GB HDD IntelÂ® GMA 4500MHD 802.11a Windows 7 Professional (3802249)|product|1712770804693

From these results it's quite easy to infer the first few queries by themselves where insufficient.

## AWS Personalize Integration
So let's think about if we wanted to use this data with the AWS Personalize service?  There is an explicit schema defined for ecommerce interaction data that we can consult at https://docs.aws.amazon.com/personalize/latest/dg/ECOMMERCE-interactions-dataset.html.

The item interaction dataset requires us to extract USER_ID, ITEM_ID, TIMESTAMP, and EVENT_TYPE.

The demo chorus site really only has one event that indicates POSTIVE engagement, which is our `add_to_cart` event.   If we had `product_click_through` or other events we could then use them as well as part of our interaction data.

We can easily retrieve the interaction data from our UBI via this SQL query (along with a message about the event to help us understand our data):

```sql
select 
	user_id AS USER_ID, 
	e.event_attributes.object.key_value as ITEM_ID,
	timestamp as TIMESTAMP,
	e.action_name as EVENT_TYPE,
	e.message
from ubi_chorus_events e
where e.user_id = 'USER-eeed-43de-959d-90e6040e84f9'
and (e.action_name = 'add_to_cart')
order by timestamp
```

The resulting data looks like:

USER_ID|ITEM_ID|TIMESTAMP|EVENT_TYPE|message
---|---|---|---|---
USER-eeed-43de-959d-90e6040e84f9|0884962707517|2024-04-10 19:10:48.348|add_to_cart|HP Compaq 6530b Notebook Black 35.8 cm (14.1") 1280 x 800 pixels Intel® Core™2 Duo 2 GB DDR2-SDRAM 320 GB HDD Intel® GMA 4500MHD 802.11a Windows 7 Professional (3802249)
USER-eeed-43de-959d-90e6040e84f9|0884420439387|2024-04-10 19:11:32.077|add_to_cart|HP EliteBook 2530p Notebook PC 30.7 cm (12.1") 1280 x 800 pixels Intel® Core™2 Duo 2 GB DDR2-SDRAM 120 GB HDD Intel® GMA X4500HD Windows Vista Business (1710195)
USER-eeed-43de-959d-90e6040e84f9|0883585328871|2024-04-10 19:11:34.387|add_to_cart|HP Compaq dc7800p Intel Core™2 Duo Processor E6550 1G/80G DVD-ROM WVST Bus Convertible Minitower PC Intel® Core™2 Duo 1 GB DDR2-SDRAM 80 GB Windows Vista Business (1459095)
USER-eeed-43de-959d-90e6040e84f9|0884420390350|2024-04-10 19:11:38.098|add_to_cart|HP Compaq 6530b Notebook PC 35.8 cm (14.1") 1440 x 900 pixels Intel® Core™2 Duo 2 GB DDR2-SDRAM 250 GB Windows Vista Business (1712804)

You can see that this user has engaged three times with HP laptops and just 1 time with an HP desktop.

> [!TIP]  
> No data? Did you double click on a laptop and choose okay in order to trigger the `add_to_cart` event?

> [!TIP]  
> Notice that we are using the individual products "EAN" as the value returned by `e.event_attributes.object.key_value`.   If we wanted the value of the internal to OpenSearch `_id` field, then we would use `e.event_attributes.object.object_id` instead.


# Personalize II
If you'd like to look at messier, more real-world-like data, follow the instructions in the next [kata](./003_import_preexisting_event_data.md)

A good query for that data would be:
```sql
select 
	user_id, query_id, action_name, message_type, message, event_attributes.object.object_type, timestamp 
from ubi_chorus_events e
where e.user_id = '103_edb3eaba-2b68-4682-a84f-b07a077545bb' and session_id = 'f9bca536-7e7e-4063-85f9-85367c6c7bb9_1137'
order by timestamp
```
