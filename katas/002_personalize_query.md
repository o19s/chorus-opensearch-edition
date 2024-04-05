# place holder for future kata

Working sql notes:
'''sql
select
   q.user_id, q.query_id, q.message_type, q.message query_test,
   e.action_name, e.message_type, e.message
   , e.event_attributes.object.object_id object_id
      , e.event_attributes.object.key_value key_value
from 
   ubi_chorus_events q
   join ubi_chorus_events e on q.query_id = e.query_id
    
where 
    q.action_name = 'on_search'
    and e.action_name = 'product_purchase' and q.message like '%laptop%'

user_id = '101_704e0d8e-b25f-45df-b160-0516018fcceb'


select
    e.session_id
    ,e.action_name
    ,e.message_type
    ,e.message
   , e.event_attributes.object.object_id object_id
      , e.event_attributes.object.key_value key_value
     , e.timestamp
from ubi_chorus_events e where 
    user_id = '101_704e0d8e-b25f-45df-b160-0516018fcceb'
order by session_id
'''