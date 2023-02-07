// s: script, d: document, u: user

function read_all_properties() { //(for editor use only) logs all current parameter values.
  var readout = `Reading All Properties [${get_now()}]`;

  var keys_script = PropertiesService.getScriptProperties().getKeys();
  var keys_user   = PropertiesService.getUserProperties().getKeys();
  var keys_doc    = PropertiesService.getDocumentProperties().getKeys();
  keys_script.sort();
  keys_user.sort();
  keys_doc.sort();

  var maxlen = 0;
  for(var key of keys_script.concat(keys_user).concat(keys_doc)){if(key.length>maxlen){maxlen = key.length;}}
  // Logger.log(maxlen);

  readout += "\n\nScript Properties:";
  for (var key of keys_script) {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${PropertiesService.getScriptProperties().getProperty(key)}"`;}
  readout += "\n\nUser Properties:";
  for (var key of keys_user)   {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${PropertiesService.getUserProperties().getProperty(key)}"`;}
  readout += "\n\nDocument Properties:";
  for (var key of keys_doc)    {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${PropertiesService.getDocumentProperties().getProperty(key)}"`;}

  readout += "\n"
  Logger.log(readout)
  return readout
}

function clear_properties(scope = "sdu"){
  if (scope.includes("s")){
    PropertiesService.getScriptProperties().deleteAllProperties();
    Logger.log("Script Properties Cleared")  
  }
  if (scope.includes("d")){
    PropertiesService.getUserProperties().deleteAllProperties();
    Logger.log("User Properties Cleared")
  }
  if (scope.includes("u")){
    PropertiesService.getDocumentProperties().deleteAllProperties();
    Logger.log("Document Properties Cleared")
  }
}

function delete_properties(keyword="",scope="sdu",exact=false){
  var del_output = `Deleting properties with keyword [${keyword}] within scope [${scope}]:`;

  if(scope.includes("s")){
    var props       = PropertiesService.getScriptProperties();
    var keys        = props.getKeys();
    del_output += "\nScript Properties\t:";
    for(var key of keys){
      if((key == keyword && exact)||(key.includes(keyword) && !exact)){
        props.deleteProperty(key);
        del_output += `${key}, `
      }
    }
  }

  if(scope.includes("d")){
    var props       = PropertiesService.getDocumentProperties();
    var keys        = props.getKeys();
    del_output  += "\nDocument Properties\t:";
    for(var key of keys){
      if((key == keyword && exact)||(key.includes(keyword) && !exact)){
        props.deleteProperty(key);
        del_output += `${key}, `
      }
    }
  }

  if(scope.includes("u")){
    var props       = PropertiesService.getUserProperties();
    var keys        = props.getKeys();
    del_output  += "\nUser Properties\t:";
    for(var key of keys){
      if((key == keyword && exact)||(key.includes(keyword) && !exact)){
        props.deleteProperty(key);
        del_output += `${key}, `
      }
    }
  }

  Logger.log(del_output)
}

function set_property(key,value,scope = "d"){
  if(scope == "s"){PropertiesService.getScriptProperties()  .setProperty(key,value);}
  if(scope == "d"){PropertiesService.getDocumentProperties().setProperty(key,value);}
  if(scope == "u"){PropertiesService.getUserProperties()   .setProperty(key,value);}
}

function set_properties(props,scope = "d"){
  if(scope == "s"){PropertiesService.getScriptProperties()  .setProperties(props);}
  if(scope == "d"){PropertiesService.getDocumentProperties().setProperties(props);}
  if(scope == "u"){PropertiesService.getUserProperties()   .setProperties(props);}
}

function get_prop_value(keyword,scope = "sdu"){
  var value_s = null;
  var value_d = null;
  var value_u = null;
  if(scope.includes("s")){var value_s = PropertiesService.getScriptProperties()  .getProperty(keyword);}
  if(scope.includes("d")){var value_d = PropertiesService.getDocumentProperties().getProperty(keyword);}
  if(scope.includes("u")){var value_u = PropertiesService.getUserProperties()    .getProperty(keyword);}

  if(value_s){return value_s;}
  if(value_d){return value_d;}
  if(value_u){return value_u;}
  return null;
}













