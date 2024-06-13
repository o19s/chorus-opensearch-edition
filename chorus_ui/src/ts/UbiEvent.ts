import { integer } from "@opensearch-project/opensearch/api/types";

/**
 * Ubi Event data structures
 */

export class UbiEventData {
	public readonly object_id_field:string;
	public object_id:string;
	public description:string|null;
	public object_detail:object|null;
	constructor(id_field:string, id:string=null, description:string=null, details:object|null=null) {
		this.object_id_field = id_field;
		this.object_id = id;
		this.description = description;
		this.object_detail = details;
	}
}
export class UbiPosition{
	public ordinal:integer|null=null;
	public x:integer|null=null;
	public y:integer|null=null;
	public trail:[string]|string|null=null;

	constructor({ordinal=null, x=null, y=null, trail=null}={}) {
		this.ordinal = ordinal;
		this.x = x;
		this.y = y;
		this.trail = trail;
	}
}


export class UbiEventAttributes {
	/**
	 * Tries to prepopulate common event attributes
	 * The developer can add an `object` that the user interacted with and
	 *   the site `position` information relevant to the event
	 * 
	 * Attributes, other than `object` or `position` can be added in the form:
	 * attributes['item1'] = 1
	 * attributes['item2'] = '2'
	 *
	 * @param {*} attributes: object with general event attributes 
	 * @param {*} object: the data object the user interacted with
	 * @param {*} position: the site position information
	 */
	public object:UbiEventData|null=null; 		//any data object
	public position:UbiPosition|null = null;	//click or other location

	//ad hoc variables
	public browser:string|null=null;
	public session_id:string|null=null;
	public page_id:string|null=null;
	public dwell_time:integer|null=null;

	constructor({attributes={}, object=null, position=null}={}) {
	  if(attributes != null){
		Object.assign(this, attributes);
	  }
	  if(object != null && Object.keys(object).length > 0){
		this.object = object;
	  }
	  if(position != null && Object.keys(position).length > 0){
		this.position = position;
	  }
	  this.setDefaultAttributes();
	}
  
	setDefaultAttributes(){
	  try{
		  //if(!this.hasOwnProperty('dwell_time') && typeof TimeMe !== 'undefined'){
		//	this.dwell_time = TimeMe.getTimeOnPageInSeconds(window.location.pathname);
		  //}
  
		  if(!this.hasOwnProperty('browser')){
			this.browser = window.navigator.userAgent;
		  }
  
		  if(!this.hasOwnProperty('session_id')){
			this.session_id = sessionStorage.getItem('session_id');
		  }
  
		  if(!this.hasOwnProperty('page_id')){
			this.page_id = window.location.pathname;
		  }
		  // ToDo: set IP
	  }
	  catch(error){
		console.log(error);
	  }
	}
  }


export class UbiEvent {
	/**
	 * The following are keywords for the logging schema
	 * All other event attributes should be set in this.event_attributes
	 */
	public readonly action_name:string;
	public readonly client_id:string;
	public query_id:string;
	public session_id:string;
	public page_id:string= window.location.pathname
	public message_type:string='INFO';
	public message:string;
	public timestamp:number=Date.now();
	public event_attributes:UbiEventAttributes = new UbiEventAttributes();

	constructor(action_name:string, client_id:string, query_id:string, message:string=null) {
		this.action_name = action_name;
		this.client_id = client_id;
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
