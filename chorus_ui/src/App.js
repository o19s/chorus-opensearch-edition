import React, {Component} from "react";
import {
  ReactiveBase,
  DataSearch,
  MultiList,
  ReactiveList,
  ResultCard
} from "@appbaseio/reactivesearch";
import AlgoPicker from './custom/AlgoPicker';
import { UbiClient } from "./ts/UbiClient.ts";
import chorusLogo from './assets/chorus-logo.png';

var UbiEvent = require('./ts/UbiEvent.ts').UbiEvent;
var UbiEventAttributes = require('./ts/UbiEvent.ts').UbiEventAttributes;
var UbiEventData = require('./ts/UbiEvent.ts').UbiEventData;
var UbiPosition = require('./ts/UbiEvent.ts').UbiPosition;


//######################################
// global variables
const event_server = "http://localhost:9200";
const search_credentials = "*:*";
const search_index = 'ecommerce'
const key_field = 'primary_ean'
const ubi_store = 'chorus'
const verbose_ubi_client = true;

const user_id = 'USER-eeed-43de-959d-90e6040e84f9'; // demo user id
const session_id = ((sessionStorage.hasOwnProperty('session_id')) ?
          sessionStorage.getItem('session_id') 
          : 'SESSION-' + guiid()); //<- new fake session, otherwise it should reuse the sessionStorage version


const ubi_client = new  UbiClient(event_server, ubi_store, user_id, session_id);

//decide if we write each event to the console
ubi_client.verbose = verbose_ubi_client;

sessionStorage.setItem('ubi_store', ubi_store);
sessionStorage.setItem('event_server', event_server);
sessionStorage.setItem('user_id', user_id);
sessionStorage.setItem('session_id', session_id);
sessionStorage.setItem('search_index', search_index);
sessionStorage.setItem('key_field', key_field);
sessionStorage.setItem('shopping_cart', 0);


//######################################
// util functions, TODO: reorganize files
  
export function add_to_cart(item=null)
{
  if(item != null){
    let shopping_cart = sessionStorage.getItem("shopping_cart");
    shopping_cart++;
    sessionStorage.setItem("shopping_cart", shopping_cart);
    var cart = document.getElementById("cart");
    cart.textContent = shopping_cart;

    let e = new UbiEvent('add_to_cart', user_id, QueryId());
    e.message_type = 'CONVERSION';
    e.message = item.title + ' (' + item.id + ')';
    e.session_id = session_id;
    e.page_id = window.location.pathname;

    e.event_attributes.object = new UbiEventData('product', item.primary_ean, item.title, item);
    ubi_client.log_event(e);
    console.log('User just bought ' + item.title);
  }
  return true;
}


function guiid() {
  let id = '';
  try{
    id = crypto.randomUUID();
  }
  catch(error){
    console.log('tried to generate a guiid in insecure context')
    id ='10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return id;
};

//string format function
String.prototype.f = function () {
  var args = arguments;
  return this.replace(/{([0-9]+)}/g, function (match, index) {
    return typeof args[index] == 'undefined' ? match : args[index];
  });
};

function genQueryId(){
  return 'QUERY-' + guiid();
}

function QueryId(){
  return sessionStorage.getItem('query_id');
}

function CurrentHeaders(){
  let query_id = sessionStorage.getItem('query_id');
  if(query_id == null || query_id == 'null' || query_id==''){
    console.log('query_id is currently null')
    return {   
      'X-ubi-store': ubi_store,
    // enable if the client were to maintain query_id's:
    //'X-ubi-query-id': genQueryId(),
      'X-ubi-user-id': user_id,
      'X-ubi-session-id':session_id,
    };
  }

  return {   
    'X-ubi-store': ubi_store,
    'X-ubi-query-id': query_id,
    'X-ubi-user-id': user_id,
    'X-ubi-session-id':session_id,
  };
}

function genObjectId(){
  return 'OBJECT-'+guiid();
}

function genTransactionId(){
  return 'TRANSACT-'+guiid();
}


/**
 * overriding send so that we can intercept the query id response
 * from any post
 */
(function(send) { 
  XMLHttpRequest.prototype.send = function(data) { 
      this.addEventListener('readystatechange', function() { 
        if (this.readyState == 4 ) {
          /**
           * only pull query_id out for searches on the main store
           * otherwise, this also runs for ubi client calls
           */
            if(this.responseURL.includes(search_index)){
              let headers = this.getAllResponseHeaders();
              if(headers.includes('query_id:')) {
              try {
                let query_id = this.getResponseHeader('query_id');
                if(query_id == null || query_id == 'null' || query_id=='') {

                  query_id = genQueryId()
                  console.warn('Received null query id.  Generated - ' + query_id);
                }
                sessionStorage.setItem('query_id', query_id);
            }
            catch(error){
              console.log(error);
            }
          } 
          else {
            console.warn('No query id in the search response headers => ' + headers);
          }
        } 
      }
      }, false); 
      try{
        send.call(this, data);
      }
      catch(error){
        console.warm('POST error: ' + error);
        console.log(data);
      }
  }; 
})(XMLHttpRequest.prototype.send);




//js EVENTS #############################################################
//on document load, hook things up here that require a fully loaded page
document.addEventListener('DOMContentLoaded', function () {


});
//###############

function logClickPosition(event) {
  let e = new UbiEvent('global_click', user_id, QueryId());
  e.message = `(${event.offsetX}, ${event.offsetY})`
  e.session_id = session_id;
  e.page_id = window.location.pathname;

  e.event_attributes.object = new UbiEventData('location', genObjectId(), e.message, event);
  e.event_attributes.object.object_type = 'click_location';
  e.event_attributes.position = new UbiPosition({x:event.clientX, y:event.clientY});
  ubi_client.log_event(e);
   
  }
  document.addEventListener("click", logClickPosition);
//EVENTS ###############################################################




const queries = {
  'default': function( value ) { return {
    query: {
      multi_match: {
        query: value,
        fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes", "primary_ean"]
      }
    }
  }}
}

class App extends Component {
  constructor(){
    super();
  }

  state = {
    customQuery: queries['default']('')
  };

  handleSearch = value => {
    this.setState({
      value
    });
  };


  componentDidMount(){
    console.log('mounted ' + this);

  }

  

  render(){
  return (
        <ReactiveBase
      componentId="market-place"
      url={event_server}
      app={search_index}
      credentials={search_credentials}
      //enableAppbase={true}  <- TODO: to allow auto analytics
      //enableAppbase={false} <- orig
      
      //**************************************************************

      
      headers={CurrentHeaders()}
      //**************************************************************
      

      

      recordAnalytics={true}
      searchStateHeader={true}
      
      transformResponse={async (response, componentId) => {
        if( componentId == 'product_type'){
          //console.log('** Type change =>' + response);
        } else if(componentId == 'supplier_name'){
          //console.log('** Brand change =>' + response);
        } else if(componentId == 'results'){
          console.log('** Search results =>' + response);
          //has_results = true;
        }else if(componentId == 'logresults'){
          //event log update
          console.warn('log update');
        } else{
          console.warn(response, componentId);
        }

        
        return response;
      }}
      transformRequest={async (request) => {
        //intercept request headers here
        
        return request;
      }}

            >
      
      <div style={{ height: "200px", width: "100%"}}>
        <img style={{ height: "100%", class: "center"  }} src={chorusLogo} />
      </div>
      
      <div>
      <button id="cart" onClick ={
            function(results) {
              alert("Maybe someday I'll show you what's in your cart!");
            }}>
              0
        </button>
        <i style={{fontSize:"28px"}} className="fa fa-shopping-cart"></i>
        </div>
        <br />
      <small><code>Your User ID: {user_id} | Your Session ID: {session_id}</code></small>
      
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
            title="Product Sort"
            componentId="algopicker" 
            ubi_client={ubi_client}
            user_id={user_id}
            query_id={QueryId()}
            session_id={session_id}
            />
          <MultiList
            componentId="supplier_name"
            dataField="supplier"
            title="Filter by Brands"
            size={20}
            showSearch={false}
            onValueChange={
              function(arr) {
                console.log('filtering on brands');
                //convert array into json object
                let sfilter = String(arr)
                let filter = {'filter':sfilter};
                let e = new UbiEvent('brand_filter', user_id, QueryId());
                e.message = 'filtering on brands: ' + sfilter;
                e.message_type = 'FILTER';
                e.session_id = session_id;
                e.page_id = window.location.pathname;
                e.event_attributes.object = new UbiEventData('filter_data', genObjectId(), "supplier_name", filter);
                ubi_client.log_event(e);
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
            dataField="filter_product_type"
            title="Filter by Product Types"
            size={20}
            showSearch={false}
            onValueChange={
              function(arr) {
              console.log('filtering on product types');
              //convert array into json object
              let sfilter = String(arr)
              let filter = {'filter':sfilter};
              let e = new UbiEvent('type_filter', user_id, QueryId());
              e.message = 'filtering on product types: ' + sfilter;
              //e.message_type = 'FILTER';
              e.session_id = session_id;
              e.page_id = window.location.pathname;
              e.event_attributes.object = new UbiEventData('filter_data', genObjectId(),"filter_product_type", filter);
              ubi_client.log_event(e);
              }
            }
            onQueryChange={  
              function(prevQuery, nextQuery) {
                if(nextQuery != prevQuery){
                
                }
              }
            }
            react={{
              and: ["searchbox", "supplier_name"]
            }}
            style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "75%" }}>
          <DataSearch 
          onValueChange={
            function(value) {
              console.log("onValueChanged search value: ", value)

              let e = new UbiEvent('on_search', user_id, QueryId(), value);
              e.message_type = 'QUERY'
              e.session_id = session_id
              e.page_id = window.location.pathname;
              ubi_client.log_event(e);
            }
          }
          onChange={
            function(value, cause, source) {
              console.log("onChange current value: ", value)
            }
          } 
          onValueSelected={
            function(value, cause, source) {
              console.log("onValueSelected current value: ", value)
            }
          }
          beforeValueChange = { function(value){
            // The update is accepted by default
            //if (value) {
                // To reject the update, throw an error
          //    console.log("beforeValueChanged current value: ", value)
            
        }}
          onQueryChange={
            function(prevQuery, nextQuery) {
              // use the query with other js code
              console.log('prevQuery', prevQuery);
              console.log('nextQuery', nextQuery);
            }
          }
            style={{
              marginTop: "35px"
            }}
            componentId="searchbox"
            placeholder="Search for products, brands or EAN"
            autosuggest={false}
            dataField={["id", "name", "title", "product_type" , "short_description", "ean", "search_attributes", "primary_ean"]}
            customQuery={ 
              function(value) {
                  return queries[ 'default' ](value);
              }
            }
          />
          <ReactiveList
            componentId="results"
            dataField="title"
            size={20}
            pagination={true}
            react={{
              and: ["searchbox", "supplier_name", "product_type"]
            }}
            onClick={
            function(results) {
              //page scrolling
              console.warn('on click');
            }
          }
            onPageClick={
              function(results) {
                //page scrolling
                //console.warn('click');
              }
            }
            style={{ textAlign: "center" }}
            render={({ data }) => (
              <ReactiveList.ResultCardsWrapper>
                {data.map((item) => (
                  <div id='product_item' key={item.id} 
                  onMouseOver={
                    function(_event) {
                        // Decide if the mouse over on the product helps tell the story.
                        // preference would be to log when a product comes into the "viewport".
                        //console.log('mouse over ' + item.title);
                        let e = new UbiEvent('product_hover', user_id, QueryId());
                        e.message = item.title + ' (' + item.primary_ean + ')';
                        e.session_id = session_id;
                        e.page_id = window.location.pathname;
      
                        e.event_attributes.object = new UbiEventData('product', item.id, item.title);
                        e.event_attributes.object.key_value = item.primary_ean;
                        //ubi_client.log_event(e);
                    }
                  }                  
                  >
                  <ResultCard key={item._id} >
                    <ResultCard.Image
                      style={{
                        backgroundSize: "cover",
                        backgroundImage: `url(${item.img_500x500})`
                      }}

                    />
                    <ResultCard.Title
                      dangerouslySetInnerHTML={{
                        __html: item.title
                      }}
                    />
                    <ResultCard.Description>
                      {item.price/100 +
                        " $ | " +
                        item.supplier}
                  <div>
                  <fieldset style={{
                      width:"110px",
                      display:"inline-block",
                      position:"relative",
                      padding:"0px",
                      fontStyle:"italic"
                      }} >
                    <legend>Result quality?</legend>
                    <div
                        style={{
                          fontSize:"28px",
                          fontWeight:"bolder",
                          fontStyle:"oblique"
                        }}
                    >
                      <label htmlFor="pos-review"
                          style={{ color: "#008000", }}> 👍
                      <input type="radio" id="pos-review" name="pos-reviewrone" value="pos"  
                          onClick={function(event){
                            var neg = document.getElementById("neg-review");
                           // neg.checked = false;
                        
                            let e = new UbiEvent('positive', user_id, QueryId());
                            e.message_type = 'RELEVANCY';
                            e.message = item.title + ' (' + item.id + ')';
                            e.session_id = session_id;
                            e.page_id = window.location.pathname;
                        
                            e.event_attributes.object = new UbiEventData('product', item.primary_ean, item.title, {'pos-review':item.primary_ean});
                            ubi_client.log_event(e);
                            console.log('pos review of ' + item.title)
                          }}/>
                      </label>
                      <input type="radio" id="neg-review" name="neg-reviewrone" value="neg"  
                      onClick={function(event){
                        var pos = document.getElementById("pos-review");
                        //pos.checked = false;
                    
                        let e = new UbiEvent('negative', user_id, QueryId());
                        e.message_type = 'RELEVANCY';
                        e.message = item.title + ' (' + item.id + ')';
                        e.session_id = session_id;
                        e.page_id = window.location.pathname;
                    
                        e.event_attributes.object = new UbiEventData('product', item.primary_ean, item.title, {'pos-review':item.primary_ean});
                        ubi_client.log_event(e);
                        console.log('pos review of ' + item.title)
                      }}/>
                      <label htmlFor="neg-review"
                          style={{ color: "#C00000", }}>👎 
                      </label>
                    </div>
                    </fieldset>
                  <button style={{ fontSize:"14px", position:"relative" }} onClick ={
            function(el) {
              add_to_cart(item);
            }}>
              Add to
                    <i style={{fontSize:"24px"}} className="fa fa-shopping-cart"></i>
                  </button>
                    </div>
                    </ResultCard.Description>
                  </ResultCard>
                  </div>
                ))}
              </ReactiveList.ResultCardsWrapper>
            )}
            onNoResults={
              function(results) {
                console.warn('no results');
              }
            }
            onData={
              function(results) {
                console.log('data query results => ' + results);
              }
            }
          />
        </div>
        
      </div>
    </ReactiveBase>
  );
}}
export default App;
