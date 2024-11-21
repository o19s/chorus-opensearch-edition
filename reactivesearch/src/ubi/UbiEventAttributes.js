class UbiEventAttributes {
  constructor(idField, id = null, description = null, details = null) {
    this.object = {
      object_id: id,
      object_id_field: idField,
      description: description,
      
    }
    
    // merge in the details, but make sure to filter out any explicit properties
    // since details is a free form that could be anything.  
    var { object_id, object_id_field, description, ...filteredDetails } = details;
    
    this.object = { ...this.object, ...filteredDetails };
   
  }
}

export default UbiEventAttributes;
