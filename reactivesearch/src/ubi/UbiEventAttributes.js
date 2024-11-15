class UbiEventAttributes {
  constructor(idField, id = null, description = null, details = null) {
    this.object_id = id;   
    this.object_id_field = idField; 

    // additional properties
    this.description = description;   
    this.object_detail = details;      
  }
}

export default UbiEventAttributes;
