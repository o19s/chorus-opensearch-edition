class UbiEvent {
  /**
   * This maps to the UBI Specification at https://github.com/o19s/ubi
   */
  constructor(action_name, client_id, session_id, query_id, event_attributes, message = null) {
    this.application = "Chorus"
    this.action_name = action_name;
    this.query_id = query_id;
    this.session_id = session_id;        
    this.client_id = client_id;
    this.user_id = '';
    this.timestamp = Date.now();
    this.message_type = 'INFO';
    this.message = message || '';     // Default to an empty string if no message
    this.event_attributes = event_attributes
  }

  setMessage(message, message_type = 'INFO') {
    this.message = message;
    this.message_type = message_type;
  }

  /**
   * Use to suppress null objects in the json output
   * @param key 
   * @param value 
   * @returns 
   */
  static replacer(key, value) {
    return (value == null) ? undefined : value; // Return undefined for null values
  }

  /**
   * 
   * @returns json string
   */
  toJson() {
    return JSON.stringify(this, UbiEvent.replacer);
  }
}
export default UbiEvent;
