import React, { Component } from "react";
import {
  ReactiveBase,
  DataSearch,
  MultiList,
  ReactiveList,
  SingleRange,
  ResultCard,
  SingleList
} from "@appbaseio/reactivesearch";
import AlgoPicker from './custom/AlgoPicker';
import ShoppingCartButton from './custom/ShoppingCartButton';
import { UbiEvent } from './ubi/ubi';
import { UbiEventAttributes } from './ubi/ubi'
import { UbiQueryRequest } from './ubi/ubi';
import { UbiClient } from './ubi/ubi'
import chorusLogo from './assets/chorus-logo.png';

const event_server = "http://localhost:9090"; // Middleware
//const event_server = "http://localhost:2021"; // DataPrepper
//const search_server = "http://localhost:9200"; // OpenSearch
const search_server = "http://localhost:9090"; // Send all queries through Middleware

const APPLICATION = "Chorus";
const client_id = ((sessionStorage.hasOwnProperty('client_id')) ?
          sessionStorage.getItem('client_id')
          : 'CLIENT-' + generateGuid());
const session_id = ((sessionStorage.hasOwnProperty('session_id')) ?
          sessionStorage.getItem('session_id')
          : 'SESSION-' + generateGuid());

const object_id_field = 'asin'; // When we refer to a object by it's ID, this describes what the ID field represents

const ubiClient = new  UbiClient(event_server);

clearQueryId(); // Clear out any existing query_id from the session.

function addToCart(item) {
  let shopping_cart = sessionStorage.getItem("shopping_cart");
  shopping_cart = parseInt(shopping_cart, 10) || 0
  shopping_cart++;
  sessionStorage.setItem("shopping_cart", shopping_cart);
  var cart = document.getElementById("cart");
  cart.textContent = shopping_cart;
  if (getQueryId()) {
    // Since we do not have a traditional detail page, which is where you would track
    // a "click" for Click Through Rate and other traditional implicit judgement based metrics
    // we are re-purposing add to cart to mean both click and add_to_cart.
    var event = new UbiEvent(APPLICATION, 'click', client_id, session_id, getQueryId(), 
      new UbiEventAttributes('asin', item.asin, item.title, {search_config: item.algo}, {ordinal:  item.position}),
      item.title + ' (' + item.id + ')');
    
    event.message_type = 'CLICK_THROUGH';
    
    ubiClient.trackEvent(event);
    console.log(event);    
    
    // Now track the add_to_cart conversion event.
    var event = new UbiEvent(APPLICATION, 'add_to_cart', client_id, session_id, getQueryId(), 
      new UbiEventAttributes('asin', item.asin, item.title, {search_config: item.algo}, {ordinal:  item.position}),
      item.title + ' (' + item.id + ')');
    
    event.message_type = 'CONVERSION';
    
    ubiClient.trackEvent(event);
    console.log(event);
  }

}

/**
 * Generates a unique query ID and stores it in sessionStorage.
 *
 * This function creates a new GUID using the `generateGuid` function,
 * saves it in the session storage under the key 'query_id',
 * and returns the generated query ID.
 *
 * It represents a unique Search Query.  It optionally can be 
 * generated on the server side and returned in the response.
 */
function generateQueryId(){
  const query_id = generateGuid();
  sessionStorage.setItem('query_id', query_id);
  return query_id;
}

function clearQueryId(){
    sessionStorage.removeItem('query_id');
}

function getQueryId(){
  return sessionStorage.getItem('query_id');
}

function generateGuid() {
  let id = '';
  try{
    id = crypto.randomUUID();
  }
  catch(error){
    // crypto.randomUUID only works in https, not http context, so fallback.
    id ='10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return id;
};

class App extends Component {

  componentDidMount() {
    this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && getQueryId() ) {
                console.log(`${entry.target.innerText} is now visible in the viewport!`);
                const position = parseInt(entry.target.attributes.position.value, 10)
                const title = entry.target.attributes.title?.value || "";
                const search_config = entry.target.attributes.algo?.value || null
                var event = new UbiEvent(APPLICATION, 'impression', client_id, session_id, getQueryId(),
                  new UbiEventAttributes('asin', entry.target.attributes.asin.value, title, {search_config: search_config}, {ordinal:  position}),
                  'impression made on doc position ' + entry.target.attributes.position.value);
                event.message_type = 'IMPRESSION';
                console.log(event);
                ubiClient.trackEvent(event);
                // Optionally unobserve the button after visibility
                this.observer.unobserve(entry.target);
            }
        });
    });
  }


  handleRef = (node) => {
       if (node) {
           this.observer.observe(node); // Observe the node when it is mounted
       }
   };
  

  render(){
  return (
    <ReactiveBase
      componentId="market-place"
      url={search_server}
      app="ecommerce"
      credentials="*:*"
      enableAppbase={false}
      recordAnalytics={true}
      searchStateHeader={true}
    >
      <div style={{ height: "200px", width: "100%"}}>
        <img style={{ height: "100%", class: "center"  }} src={chorusLogo} />
        <div style={{float:"right"}}>
          <small>
            <code>Your Client ID: {client_id}</code>
            <br/>
            <code>Your Session ID: {session_id}</code>
            <br/>
            <code>Your <span style={{fontSize:24 }}>🛒</span> Items:
              <ShoppingCartButton/>              
            </code>
          </small>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "20%",
            margin: "10px",
            marginTop: "50px"
          }}
        >
          <AlgoPicker
            title="Pick your Algo"
            componentId="algopicker" />
            <MultiList
              componentId="supplier_name"
              dataField="attrs.Brand.keyword"
              title="Filter by Brands"
              size={20}
              showSearch={false}
              onValueChange={
                function(arr) {
                  console.log('filtering on brands');
                  if (getQueryId()) {
                    //convert array into json object
                    let sfilter = String(arr)
                    let filter = { 'filter': sfilter };
                    var event = new UbiEvent(APPLICATION, 'brand_filter', client_id, session_id, getQueryId(),
                      new UbiEventAttributes('filter_data', null, "brands_list", sfilter, {ordinal:  -1}),
                      'filtering on brands: ' + sfilter);
                    event.message_type = 'FILTER';
                    console.log(event);
                    ubiClient.trackEvent(event);
                  }
                }
              }
              onQueryChange={
                function(prevQuery, nextQuery) {
                  if(nextQuery != prevQuery){

                  }
                }
              }
              react={{
                and: ["searchbox", "product_type"]
              }}
              style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
            />
            <MultiList
              componentId="product_type"
              dataField="category_filter"
              title="Filter by Product Types"
              size={20}
              showSearch={false}
              react={{
                and: ["searchbox", "supplier_name"]
              }}
              style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
              onValueChange={
                function(arr) {
                console.log('filtering on product types');
                  if (getQueryId()) {
                    //convert array into json object
                    let sfilter = String(arr)
                    let filter = { 'filter': sfilter };
                    var event = new UbiEvent(APPLICATION, 'product_type_filter', client_id, session_id, getQueryId(),
                      new UbiEventAttributes('filter_data', null, "product_types", sfilter, {ordinal:  -1}),
                      'filtering on product types: ' + sfilter);
                    event.message_type = 'FILTER';
                    console.log(event);
                    ubiClient.trackEvent(event);
                  }
                }
              }
              onQueryChange={
                function(prevQuery, nextQuery) {
                  if(nextQuery != prevQuery){

                  }
                }
              }

            />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "75%" }}>
          <DataSearch
            style={{
              marginTop: "35px"
            }}
            componentId="searchbox"
            placeholder="Search for products, brands or ASIN"
            autosuggest={false}
            dataField={["id", "title", "category", "bullets", "description", "attrs.Brand", "attrs.Color"]}
            debounce={300}
            onKeyPress={
              function(value) {
                // With every keypress generate a new query id and store it in the session to track events against. 
                // We currently don't have any debouncing or triggering only on return.
                // this ensures we generate the new query_id before the customQuery() function is called.
                // onValueChange is called AFTER customQuery() function is called.
                generateQueryId();
              }
            }
            onValueChange={
              function (value) {
                // If you do not have the UBI plugin enabled in your search engine, then you need
                // to track the query request yourself.
                // const query = new UbiQueryRequest(APPLICATION, client_id, query_id, value, "_id", {});
                // console.log(query)
                // ubiClient.trackQuery(query)
                // 
                // Don't forget to change the query to use ext: extJsonDisabledUBI instead of ext: extJson
                // to make sure you don't double track the events, once in the ubiClient.trackQuery and once in the OS UBI plugin!
                
                // We log the event to ubi_events but that isn't strictly required since
                // the plugin in OpenSearch will log a record into ubi_queries.
                const event = new UbiEvent(APPLICATION, 'search', client_id, session_id, getQueryId(), null, value);
                event.message_type = 'QUERY'
                console.log(event)
                ubiClient.trackEvent(event);
              }
            }
            customQuery={
              function(value) {
                var algopicker = document.getElementById('algopicker');
                var algo = null;
                if (algopicker) {
                  algo = algopicker.value
                } else {
                  algo = 'keyword';
                }
                var config_a = null;
                var config_b = null;
                if (algo === 'ab') {
                    config_a = document.getElementById('conf_a').value;
                    config_b = document.getElementById('conf_b').value;
                }
                // getQueryId() is not a blocking operation, and sometimes the onKeyPress
                // call to create the query_id hasn't finished, so we get back a null.
                // This is to basically pause long enough till we get a query id.
                let query_id = null;
                for (let i = 0; i < 1000; i++) {
                    query_id = getQueryId();
                    if (query_id !== null) {
                        console.log(`Value found: ${query_id}`);
                        break; // Exit the loop if the value is not null
                    }
                }
                
                if (query_id === null){
                  console.error("Query ID was not successfully generated, which means this search sent to OpenSearch will fail!")
                }
            
                // no UBI clauses means no use of the OpenSearch UBI plugin.
                const extJsonDisabledUBI = {
            
                }
                // Have to add a component to collect the AB config names to enable AB testing
                let extJson = {
                  ubi: {
                    query_id: getQueryId(),
                    user_query: value,
                    client_id: client_id,
                    object_id_field: object_id_field,
                    application: APPLICATION,
                    query_attributes: {}
                  }
                };
                if (algo === 'ab') {
                  let extJ = {
                    conf_a: config_a,
                    conf_b: config_b,
                    ubi: {
                        query_id: getQueryId(),
                        user_query: value,
                        client_id: client_id,
                        object_id_field: object_id_field,
                        application: APPLICATION,
                        query_attributes: {}
                    }
                  };
                  return {
                    query: {
                      multi_match: {
                        query: value,
                        fields: ["id", "title", "category", "bullets", "description", "attrs.Brand", "attrs.Color"]
                      }
                    },
                    ext: extJ
                  }
                }
                else if (algo === "keyword") {
                  return {
                    query: {
                      multi_match: {
                        query: value,
                        fields: ["id", "title", "category", "bullets", "description", "attrs.Brand", "attrs.Color"]
                      }
                    },
                    ext: extJson
                  }
                } else if (algo === "neural") {
                  return {
                    search_pipeline: "neural-search-pipeline",                                      
                    query: {                  
                      neural: {
                        title_embedding: {
                          query_text: value,
                          k: 50
                        }
                      }
                    },                    
                    ext: extJson                 
                  }
                } else if (algo === "hybrid") {
                  return {
                    search_pipeline: "hybrid-search-pipeline",
                    query: {
                      hybrid: {
                        queries: [
                          {
                            match: {
                              title: {
                                query: value
                              }
                            }
                          },
                          {
                            neural: {
                              title_embedding: {
                                query_text: value,
                                k: 50
                              }
                            }
                          }
                        ]
                      }
                    },
                    ext: extJson
                  }
                } 
               else {
                  console.log("Could not determine algorithm");
                }
              }
            }
          />
          <ReactiveList
            componentId="results"
            dataField="title"
            size={20}
            excludeFields={["title_embedding", "reviews", "description", "bullets"]}
            pagination={true}
            react={{
              and: ["searchbox", "supplier_name", "product_type"]
            }}
            style={{ textAlign: "center" }}
            render={({ data }) => (
              <ReactiveList.ResultCardsWrapper>
                {data.map((item, index) => (
                  <ResultCard key={item._id}>
                    <ResultCard.Image
                      style={{
                        backgroundSize: "cover",
                        backgroundImage: `url(${item.image})`
                      }}
                    />
                    <ResultCard.Title
                      dangerouslySetInnerHTML={{
                        __html: item.title
                      }}
                    />
                    <ResultCard.Description>
                      {item.price + " $ | "}
                      {item.attrs.Brand ? item.attrs.Brand : ""}
                    </ResultCard.Description>
                    <button 
                      style={{ fontSize:"14px", position:"relative" }}       
                      ref={this.handleRef}   
                      position={ index }
                      asin={ item.asin }
                      title={ item.title }
                      algo={item.search_config}
                      onClick={
                        function(el) {
                          addToCart({ ...item, position: index, algo: item.search_config });
                        }
                      }
                    >
                      Add to <span style={{fontSize:24 }}> 🛒 </span><span> | rank: {index}</span>
                    </button>
                  </ResultCard>
                ))}
              </ReactiveList.ResultCardsWrapper>
            )}
          />
        </div>
      </div>
    </ReactiveBase>
  );
}}
export default App;
