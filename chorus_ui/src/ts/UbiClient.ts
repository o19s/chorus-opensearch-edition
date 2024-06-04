import axios, {AxiosRequestConfig, AxiosInstance} from "axios";
import { UbiEvent } from "./UbiEvent";

/**
 * Methods and client to talk directly with the OpenSearch Ubi plugin
 * for logging events
 */

/**
 * Class to handle OpenSearch authentication (eventually) log connectivity
 */
export class UbiClient {
    static readonly API = '/log/ingest';

    private readonly url:string;
    //private readonly ubi_application:string;
    private readonly rest_client:AxiosInstance; //client for direct http work
    private readonly rest_config:AxiosRequestConfig;
    private search_index:string;
    private object_id_field:string;
    private verbose:number=0;


    //TODO: capture response and request headers
    constructor(baseUrl:string) {

        this.url = baseUrl + UbiClient.API;

        //TODO: make these parameters when the interface is more finalized
        this.search_index = sessionStorage.getItem('search_index');
        this.object_id_field = sessionStorage.getItem('object_id_field');

        //TODO: add authentication
        this.rest_config = {
     			headers :{
      				'Content-type': 'application/x-www-form-urlencoded',
     			},
    		};

        //TODO: replace with more precise client configuration
        this.rest_client = axios.create({
            baseURL: baseUrl,
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            //headers: { 'Content-type': 'application/json' },
            withCredentials:true
        });

    }



    async log_event(e:UbiEvent, message:string|null=null, message_type:string|null=null){
        if(message){
            if(e.message){
                e['extra_info'] = message;
                if(message_type)
                    e['extra_info_type'] = message_type;
            }
            else{
                e.message = message;
                e.message_type = message_type;
            }
        }
        // Data prepper appears to always want an array of JSON.
        let json = JSON.stringify([e]);
        if(this.verbose > 0){
            console.log('POSTing event: ' + json);
        }

        return this._post(json);
    }

    /**
     * Delete the ubi store.  Allow clients to do this?
     * @returns
     *
    async delete() {
        try {
            const response = await this.rest_client.delete(this.url + this.ubi_application, this.rest_config )
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }
    */
    async _get(url) {
        try {
            const data = this.rest_client.get(url, this.rest_config).then(
                function(response){
                return response.data;
                }
            ).catch(
                (error) => {
                    console.warn('GET Error: ' + error);
                    console.warn(url);
                } 
            )
            return data;
        } catch (error) {
            console.error(error);
        }
    }

    async _post(data) {
        try {
            const response = await this.rest_client.post(this.url, data, this.rest_config);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    async _put(data=null) {
        try {
            const response = await this.rest_client.put(this.url, data, this.rest_config);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }


}
