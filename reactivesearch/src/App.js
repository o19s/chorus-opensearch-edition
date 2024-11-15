import React, {Component} from "react";
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
import UbiEvent from './ubi/UbiEvent';
import UbiEventAttributes from './ubi/UbiEventAttributes'
import chorusLogo from './assets/chorus-logo.png';

const search_server = "http://localhost:9090"; // Send all queries through Middleware

const client_id = 'CLIENT-eeed-43de-959d-90e6040e84f9'; // demo client id
const session_id = ((sessionStorage.hasOwnProperty('session_id')) ?
          sessionStorage.getItem('session_id')
          : 'SESSION-' + genGuid());



function addToCart(item) {
  let shopping_cart = sessionStorage.getItem("shopping_cart");
  shopping_cart = parseInt(shopping_cart, 10) || 0
  shopping_cart++;
  sessionStorage.setItem("shopping_cart", shopping_cart);
  var cart = document.getElementById("cart");
  cart.textContent = shopping_cart;
  
  const event = new UbiEvent('add_to_cart', client_id, 
    getQueryId(), 
    new UbiEventAttributes('product', item.primary_ean, item.title, item), 
    item.title + ' (' + item.id + ')');
  
  event.message_type = 'CONVERSION';
  
  console.log(event);

}

function getQueryId(){
  return sessionStorage.getItem('query_id');
}

function genGuid() {
  let id = '';
  try{
    id = crypto.randomUUID();
  }
  catch(error){
    console.log('tried to generate a genGuid in insecure context')
    id ='10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return id;
};

class App extends Component {

  render(){
  return (
    <ReactiveBase
      componentId="market-place"
      url={search_server}
      app="ecommerce"
      credentials="*:*"
      enableAppbase={false}
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
            dataField="supplier"
            title="Filter by Brands"
            size={20}
            showSearch={false}
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
            react={{
              and: ["searchbox", "supplier_name"]
            }}
            style={{ "paddingBottom": "10px", "paddingTop": "10px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "75%" }}>
          <DataSearch
            style={{
              marginTop: "35px"
            }}
            componentId="searchbox"
            placeholder="Search for products, brands or EAN"
            autosuggest={false}
            dataField={["id", "name", "title", "product_type" , "short_description", "ean", "search_attributes", "primary_ean"]}
            customQuery={
              function(value) {
                var elem = document.getElementById('algopicker');
                var algo = "";
                if (elem) {
                  algo = elem.value
                } else {
                  console.log("Unable to determine selected algorithm!");
                  algo = 'keyword';
                }
                if (algo === "keyword") {
                  return {
                    query: {
                      multi_match: {
                        query: value,
                        fields: [ "id", "name", "title", "product_type" , "short_description", "ean", "search_attributes", "primary_ean"]
                      }
                    }
                  }
                } else if (algo === "neural") {
                  return {
                    search_pipeline: "neural-search-pipeline",
                    // ext:{
                    //   ubi:{
                    //     query_id: getQueryId(),
                    //     user_query:value,
                    //     client_id:client_id,
                    //     object_id_field:object_id_field,
                    //     query_attributes:{
                    //       application:ubi_application
                    //     }
                    //   }
                    // },                    
                    "_source": {
                        exclude: [
                          "title_embedding"
                        ]
                    },
                    query: {
                      hybrid: {
                        queries: [
                          {
                            neural: {
                              title_embedding: {
                                query_text: value,
                                k: 5
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                } else if (algo === "hybrid") {
                  return {
                    search_pipeline: "hybrid-search-pipeline",
                    // ext:{
                    //   ubi:{
                    //     query_id: getQueryId(),
                    //     user_query:value,
                    //     client_id:client_id,
                    //     object_id_field:object_id_field,
                    //     query_attributes:{
                    //       application:ubi_application
                    //     }
                    //   }
                    // },     
                    "_source": {
                        exclude: [
                          "title_embedding"
                        ]
                    },
                    query: {
                      hybrid: {
                        queries: [
                          {
                            match: {
                              title_text: {
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
                    }
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
            pagination={true}
            react={{
              and: ["searchbox", "supplier_name", "product_type"]
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
                      {item.price/100 + " $ | " + item.supplier}
                    </ResultCard.Description>
                    <button style={{ fontSize:"14px", position:"relative" }} onClick ={
                      function(el) {
                        addToCart(item);
                      }
                    }>
                      Add to <span style={{fontSize:24 }}> 🛒</span>
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
