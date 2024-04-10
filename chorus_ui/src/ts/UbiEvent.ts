import { integer } from "@opensearch-project/opensearch/api/types";

/**
 * Ubi Event data structures
 */

export class UbiEventData {
	public readonly object_type:string;
	public object_id:string;
	public key_value:string;
	public description:string|null;
	public object_detail:object|null;
	constructor(type:string, id:string=null, description:string=null, details:object|null=null) {
		this.object_type = type;
		this.object_id = id;
		this.description = description;
		this.object_detail = details;

		//override if using key_field's and values
		this.key_value = id;
	}
}
export class UbiPosition{
	public ordinal:integer|null=null;
	public x:integer|null=null;
	public y:integer|null=null;
	public trail:string|null=null;

	constructor({ordinal=null, x=null, y=null, trail=null}={}) {
		this.ordinal = ordinal;
		this.x = x;
		this.y = y;
		this.trail = trail;
	}
}


export class UbiEventAttributes {
	/**
	 * Attributes, other than `object` or `position` should be in the form of
	 * attributes['item1'] = 1
	 * attributes['item2'] = '2'
	 * 
	 * The object member is reserved for further, relevant object payloads or classes
	 */
	public object:UbiEventData|null=null; 		//any data object
	public position:UbiPosition|null = null;	//click or other location
	constructor(object:UbiEventData|null=null, position:UbiPosition|null=null) {
		if(object)
			this.object = object;

		if(position)
			this.position = position;
	}
}



export class UbiEvent {
	/**
	 * The following are keywords for the logging schema
	 * All other event attributes should be set in this.event_attributes
	 */
	public readonly action_name:string;
	public readonly user_id:string;
	public query_id:string;
	public session_id:string;
	public page_id:string= window.location.pathname
	public message_type:string='INFO';
	public message:string;
	public timestamp:number=Date.now();
	public event_attributes:UbiEventAttributes = new UbiEventAttributes();

	constructor(action_name:string, user_id:string, query_id:string, message:string=null) {
		this.action_name = action_name;
		this.user_id = user_id;
		this.query_id = query_id;

		if( message )
			this.message = message;
	}

	setMessage(message:string, message_type:string='INFO'){
		this.message = message
		this.message_type = message_type
	}

	/**
	 * Use to suppress null objects in the json output
	 * @param key 
	 * @param value 
	 * @returns 
	 */
	static replacer(key, value){
		if(value == null)
			return undefined;
		return value;
	}

	/**
	 * 
	 * @returns json string
	 */
	toJson():string {
		return JSON.stringify(this, UbiEvent.replacer);
	}
}
