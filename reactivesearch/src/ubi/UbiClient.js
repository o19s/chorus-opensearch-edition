import axios from 'axios';
import { UbiEvent } from './UbiEvent';

/**
 * Methods and client to talk directly with the OpenSearch UBI plugin
 * for logging events
 */

/**
 * Class to handle OpenSearch authentication (eventually) log connectivity
 */
class UbiClient {
    constructor(baseUrl) {
        // Eric: baseUrl isn't working I think.  
        this.url = `${baseUrl}/ubi_events`;
        
        //TODO: make these parameters when the interface is more finalized
        this.search_index = sessionStorage.getItem('search_index');
        this.object_id_field = sessionStorage.getItem('object_id_field');

        //TODO: add authentication
        this.rest_config = {
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
            }
        };

        //TODO: replace with more precise client configuration
        this.rest_client = axios.create({
            baseURL: baseUrl,
            headers: { 
                'Content-type': 'application/json', 
                'Accept': 'application/json' 
            },
            withCredentials: false
        });

        this.verbose = 0; // Default value for verbose
    }

    async log_event(e, message = null, message_type = null) {
        if (message) {
            if (e.message) {
                e['extra_info'] = message;
                if (message_type) {
                    e['extra_info_type'] = message_type;
                }
            } else {
                e.message = message;
                e.message_type = message_type;
            }
        }

        // Data prepper appears to always want an array of JSON.
        let json = JSON.stringify([e]);
        if (this.verbose > 0) {
            console.log('POSTing event: ' + json);
        }

        return this._post(json);
    }

    

    async _get(url) {
        try {
            const data = await this.rest_client.get(url, this.rest_config);
            return data.data;
        } catch (error) {
            console.warn('GET Error: ' + error);
            console.warn(url);
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

    async _put(data = null) {
        try {
            const response = await this.rest_client.put(this.url, data, this.rest_config);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }
}

export default UbiClient;
