import React, {Component} from "react";
import {
  ReactiveBase,
  DataSearch,
  MultiList,
  ReactiveList,
  ResultCard,
  StateProvider,
} from "@appbaseio/reactivesearch";
import AlgoPicker from './custom/AlgoPicker';
import fetchIntercept from 'fetch-intercept';


//######################################
// global variables
let has_results = false;//debug


const log_store = 'ubl_log';
const user_id = 'DEMO-eeed-43de-959d-90e6040e84f9'; // demo user id
const session_id = ((sessionStorage.hasOwnProperty('session_id')) ?
          sessionStorage.getItem('session_id') 
          : 'DEMO-' + guiid()); //<- new fake session, otherwise it should reuse the sessionStorage version
let query_id = ((sessionStorage.hasOwnProperty('query_id')) ?
          sessionStorage.getItem('query_id') 
          : 'need a query id');

sessionStorage.setItem('user_id', user_id);
sessionStorage.setItem('session_id', session_id);
sessionStorage.setItem('query_id', query_id);


//######################################
// util functions, TODO: reorganize
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

function getGenerateQueryId(){
  let id = sessionStorage.getItem('query_id');
  if(id == null){
    id = 'DEMO-'+ guiid();
  }
  query_id = id;
  return id;
}

function genDataId(){
  return 'DEMO-'+guiid();
}



(function(send) { 
  XMLHttpRequest.prototype.send = function(data) { 
      this.addEventListener('readystatechange', function() { 
        if (this.readyState == 4 ){//} && this.status == 200) {
          let headers = this.getAllResponseHeaders();
          //if(headers.search('X-ubl-query-id') != -1) {
          if(headers.search('query-id') != -1) {
            console.log('query token = ' + this.getResponseHeader('query-id')) ;
            query_id = this.getResponseHeader('query-id');
          }
          console.log(headers);
        }

      }, false); 
      try{
        send.call(this, data);
      }
      catch(error){
        console.warm('POST error: ' + error);
        console.log(data);
      }
      //if(has_results){
      //  console.log('posted');
     // }
  }; 
})(XMLHttpRequest.prototype.send);


/*
XMLHttpRequest.setDisableHeaderCheck = function(data) { 
  return false;
}; 
(function(setDisableHeaderCheck) { 
  XMLHttpRequest.prototype.setDisableHeaderCheck = function(data) { 
      return true;
  }; 
})(XMLHttpRequest.prototype.setDisableHeaderCheck);
*/
/*
(function(getAllResponseHeaders) { 
  XMLHttpRequest.prototype.getAllResponseHeaders = function() { 

    console.log('getting headers');
    return getAllResponseHeaders.call(this);
  }; 
})(XMLHttpRequest.prototype.getAllResponseHeaders);
*/
import {CollectorModule, Context, InstantSearchQueryCollector, Trail, Query, cookieSessionResolver, ConsoleTransport} from "search-collector";

var UbiWriter = require('./ts/UbiWriter.ts').UbiWriter;
var UbiEvent = require('./ts/UbiEvent.ts').UbiEvent;
var UbiAttributes = require('./ts/UbiEvent.ts').UbiEventAttributes;
var UbiData = require('./ts/UbiEvent.ts').UbiEventData;


const sessionResolver = () => cookieSessionResolver();

const queryResolver = () => {
	const params = new URLSearchParams(window.location.search);

	const query = new Query();
	query.setSearch(params.get("query"));

	return query;
}
const debug = true;
const trail = new Trail(queryResolver, sessionResolver);
const context = new Context(window, document);


// TODO: move parameters to properties file
const writer = new UbiWriter('http://127.0.0.1:9200', log_store, queryResolver, sessionResolver,  debug);


//##################################################################
//on document load, hook things up here
document.addEventListener('DOMContentLoaded', function () {


});
//##################################################################




const queries = {
  'default': function( value ) { return {
    query: {
      multi_match: {
        query: value,
        fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"]
      }
    }
  }},
/*   'querqy_preview':function( value ) { return{
    query: {
      querqy: {
        matching_query: {
          query: value
        },
        query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
        rewriters: ["replace_prelive", "common_rules_prelive"]
      }
    }
  }},
  'querqy_live':function( value ) { return{
    query: {
      querqy: {
        matching_query: {
          query: value
        },
        query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
        rewriters: ["replace", "common_rules"]
      }
    }
  }}, */
  // 'querqy_boost_by_img_emb':function( value ) { return{
  //   query: {
  //     querqy: {
  //       matching_query: {
  //         query: value
  //       },
  //       query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
  //       rewriters: [
  //         {
  //           "name": "embimg",
  //           "params": {
  //             "topK": 200,
  //             "mode": "BOOST",
  //             "f": "product_image_vector",
  //             "boost": 10.0
  //           }
  //         }
  //       ]
  //     }
  //   }
  // }},
  // 'querqy_match_by_img_emb':function( value ) { return{
  //   query: {
  //     querqy: {
  //       matching_query: {
  //         query: value
  //       },
  //       query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
  //       rewriters: [
  //         {
  //           "name": "embimg",
  //           "params": {
  //             "topK": 200,
  //             "mode": "MAIN_QUERY",
  //             "f": "product_image_vector"
  //           }
  //         }
  //       ]
  //     }
  //   }
  // }},
  // 'querqy_boost_by_txt_emb': function( value ) { return{
  //   query: {
  //     querqy: {
  //       matching_query: {
  //         query: value
  //       },
  //       query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
  //       rewriters: [
  //         {
  //           "name": "embtxt",
  //           "params": {
  //             "topK": 200,
  //             "mode": "BOOST",
  //             "f": "product_vector",
  //             "boost": 10.0
  //           }
  //         }
  //       ]
  //     }
  //   }
  // }},
  // 'querqy_match_by_txt_emb':function( value ) { return{
  //   query: {
  //     querqy: {
  //       matching_query: {
  //         query: value
  //       },
  //       query_fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"],
  //       rewriters: [
  //         {
  //           "name": "embtxt",
  //           "params": {
  //             "topK": 200,
  //             "mode": "MAIN_QUERY",
  //             "f": "product_vector"
  //           }
  //         }
  //       ]
  //     }
  //   }
  // }},
}

class App extends Component {
  constructor(){
    super();
  }

  search_text=''
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


    let e = new UbiEvent('logon', user_id, query_id);
    e.message = 'This is a test message'
    e['outer'] =  'outer test';
    
    //xx console.log(JSON.stringify(e));

    e.page_id = 'chorus_page1';
    e.session_id = '18734032'
    e.event_attributes['test'] =  'this is a test';
    e.event_attributes['test2'] =  1234;
    //xx console.log(JSON.stringify(e));

    e.event_attributes.data = new UbiData('test_data', genDataId(), {'inner':'data object'});
    //xx console.log(e.toJson());
    //writer.write(e.toJson());
  }

  

  render(){
  return (
    //TODO: move url and other configs to proerties file
    <ReactiveBase
      url="http://localhost:9200"
      app="ecommerce"
      credentials="elastic:ElasticRocks"
      //enableAppbase={true}  <- TODO: to allow auto analytics
      //enableAppbase={false} <- orig
      
      headers={{   
        'X-ubl-store':log_store,
        'X-ubl-query-id': query_id,
        'X-ubl-user-id': user_id,
        'X-ubl-session-id':session_id,
        'Access-Control-Expose-Headers':'query_id'
      }}

      recordAnalytics={true}
      searchStateHeader={true}
      
      transformResponse={async (response, componentId) => {
        if( componentId == 'typefilter'){
          //console.log('** Type change =>' + response);
        } else if(componentId == 'brandfilter'){
          //console.log('** Brand change =>' + response);
        } else if(componentId == 'results'){
          console.log('** Search results =>' + response);
          has_results = true;
        }
        else{
          console.warn(response, componentId);
        }

        
        return response;
      }}
      transformRequest={async (request) => {
        request.headers['test'] = 'xyz';
        //request.headers['Access-Control-Expose-Headers'] = 'query_id';
       //console.log(request);
        
        return request;
      }}

            
    >
      <StateProvider
          onChange={(prevState, nextState) => {
            let queryString = nextState;
            console.log('Page.onChange - ' + queryString.searchbox.value);
            //this.search_text = queryString.searchbox.value;
          }}
          
      />
      <div style={{ height: "200px", width: "100%"}}>
        <img style={{ height: "100%", class: "center"  }} src={require('./assets/chorus-logo.png').default} />
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
            componentId="algopicker" 
            writer={writer}
            user_id={user_id}
            query_id={query_id}
            session_id={session_id}
            />
          <MultiList
            componentId="brandfilter"
            dataField="supplier"
            title="Filter by Brands"
            size={20}
            showSearch={false}
            onQueryChange={  
              function(prevQuery, nextQuery) {
                if(nextQuery != prevQuery){
                  console.log('filtering on brands');
                  let e = new UbiEvent('brand_filter', user_id, query_id);
                  e.message = 'filtering on brands'
                  e.session_id = session_id
                  e.page_id = 'main'

                  e.event_attributes.data = new UbiData('filter_data', genDataId(), nextQuery);
                  writer.write_event(e);
                }
              }
            }
            react={{
              and: ["searchbox", "typefilter"]
            }}
            style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
          />
          <MultiList
            componentId="typefilter"
            dataField="filter_product_type"
            title="Filter by Product Types"
            size={20}
            showSearch={false}
            onQueryChange={  
              function(prevQuery, nextQuery) {
                if(nextQuery != prevQuery){
                  console.log('filtering on product types');
                  let e = new UbiEvent('type_filter', user_id, query_id);
                  e.message = 'filtering on product types'
                  e.session_id = session_id
                  e.page_id = 'main'

                  e.event_attributes.data = new UbiData('filter_data', genDataId(), nextQuery);
                  writer.write_event(e);
                }
              }
            }
            react={{
              and: ["searchbox", "brandfilter"]
            }}
            style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "75%" }}>
          <DataSearch 
          
          onValueChange={
            function(value) {
              console.log("onValueChanged search value: ", value)

              //TODO: pull in user id, query id, page id, etc.
              let e = new UbiEvent('on_search', user_id, query_id, value);
              e.message_type = 'QUERY'
              e.session_id = session_id
              e.page_id = 'main'
              writer.write_event(e);
              //writer.write(value);
            }
          }
          onChange={
            function(value, cause, source) {
            //  console.log("onChange current value: ", value)
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
                //throw Error('Search value should not contain social.');
                //this.setState({searchText:value});
                //this.state.searchText = value
                //alert(this.state)

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
            dataField={["id", "name", "title", "product_type" , "short_description", "ean", "search_attributes"]}
            /**/ 
            customQuery={ 
              
              function(value) {
                  return queries[ 'default' ](value);
              }
            }
                /*
                var elem = document.getElementById('algopicker');
                var algo = "";
                if (elem) {
                  algo = elem.value
                } else {console.log("Unable to determine selected algorithm!");}
                if (algo in queries) {
                  //xx console.log(JSON.stringify(queries[ algo ](value)));
                  
                  return queries[ algo ](value);

                } else {
                  console.log("Could not determine algorithm");
                }
              }
             }
             /**/
          />
          <ReactiveList
            componentId="results"
            dataField="title"
            size={20}
            pagination={true}
            react={{
              and: ["searchbox", "brandfilter", "typefilter"]
            }}
            style={{ textAlign: "center" }}
            render={({ data }) => (
              <ReactiveList.ResultCardsWrapper>
                {data.map((item) => (
                  <ResultCard key={item._id}>
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
                    </ResultCard.Description>
                  </ResultCard>
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
