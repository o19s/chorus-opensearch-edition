import axios from 'axios';
import { UbiEvent } from './UbiEvent';

/**
 * Methods and client to talk directly with the OpenSearch UBI plugin
 * for logging events
 */

class UbiClient {
    constructor(baseUrl) {
        
        //TODO: add authentication
        this.rest_config = {
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
            }
        };

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

    async _post(data) {
        try {
            const response = await this.rest_client.post(this.url, data, this.rest_config);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }
}

export default UbiClient;
