# Personalize I

Let's say you're searching for a laptop. 
You type "laptop" but you want an HP laptop, so you click on the HP brand filter, and _Chorus_ suggests screen protectors instead of laptops.
Try querying for "pcs" instead and then filter on HP's.
Now _Chorus_ is offering you laptop bags!
Try filtering the product type on 'PC'.  Still garbage?
Try adding 'Notebook' to the product type.
Finally, you're seeing the types of HP laptops you had in mind, and you buy one!


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
