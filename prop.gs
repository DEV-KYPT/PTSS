// s: script, d: document, u: user

function read_props(keyword = "",scope = "sdu",do_log = true) { //(for editor use only) logs all current parameter values.
  var readout = null;
  if(keyword == "" && scope == "sdu"){readout = `Reading All Properties [${get_now()}]`;}
  else{readout = `Reading props with keyword [${keyword}] within scope [${scope}] [${get_now()}]`}

  var keys_script = PropertiesService.getScriptProperties().getKeys();
  var keys_user   = PropertiesService.getUserProperties().getKeys();
  var keys_doc    = PropertiesService.getDocumentProperties().getKeys();
  keys_script.sort();
  keys_user.sort();
  keys_doc.sort();

  if(scope.includes("s")){keys_script = keys_script.filter(key => key.includes(keyword));}
  else                   {keys_script = [];}
  if(scope.includes("d")){keys_doc = keys_doc.filter(key => key.includes(keyword));}
  else                   {keys_doc = [];}
  if(scope.includes("u")){keys_user = keys_user.filter(key => key.includes(keyword));}
  else                   {keys_user = [];}

  var obj_script = PropertiesService.getScriptProperties().getProperties();
  var obj_doc    = PropertiesService.getDocumentProperties().getProperties();
  var obj_user   = PropertiesService.getUserProperties().getProperties();

  var maxlen = 0;
  for(var key of keys_script.concat(keys_user).concat(keys_doc)){if(key.length>maxlen){maxlen = key.length;}}

  if(scope.includes("s")){
    readout += "\n\nScript Properties:";
    for (var key of keys_script) {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${obj_script[key]}"`;}
  }

  if(scope.includes("u")){
    readout += "\n\nUser Properties:";
    for (var key of keys_user)   {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${obj_user[key]}"`;}
  }

  if(scope.includes("d")){
    readout += "\n\nDocument Properties:";
    for (var key of keys_doc)    {readout += `\n\t"${key}"${' '.repeat(maxlen-key.length)} >> "${obj_doc[key]}"`;}
  }

  readout += "\n"
  if(do_log){Logger.log(readout);}
  return readout
}

function clear_props(scope = "sdu"){
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

function delete_props(keyword="",scope="sdu",exact=false){
  var del_output = `Deleting props with keyword [${keyword}] within scope [${scope}]:`;

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

function set_prop(key,value,scope = "d"){
  if(scope == "s"){PropertiesService.getScriptProperties()  .setProperty(key,value);}
  if(scope == "d"){PropertiesService.getDocumentProperties().setProperty(key,value);}
  if(scope == "u"){PropertiesService.getUserProperties()   .setProperty(key,value);}
}

function set_props(props,scope = "d"){
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

function get_props(keyword = "",scope = "sdu"){

  var keys_script = PropertiesService.getScriptProperties().getKeys();
  var keys_user   = PropertiesService.getUserProperties().getKeys();
  var keys_doc    = PropertiesService.getDocumentProperties().getKeys();

  if(scope.includes("s")){keys_script = keys_script.filter(key => key.includes(keyword));}
  else                   {keys_script = [];}
  if(scope.includes("d")){keys_doc = keys_doc.filter(key => key.includes(keyword));}
  else                   {keys_doc = [];}
  if(scope.includes("u")){keys_user = keys_user.filter(key => key.includes(keyword));}
  else                   {keys_user = [];}

  var obj_script = PropertiesService.getScriptProperties().getProperties();
  var obj_doc    = PropertiesService.getDocumentProperties().getProperties();
  var obj_user   = PropertiesService.getUserProperties().getProperties();

  var result = {};

  if(scope.includes("s")){for (var key of keys_script) {result[key] = obj_script[key];}}
  if(scope.includes("u")){for (var key of keys_user) {result[key] = obj_user[key];}}
  if(scope.includes("d")){for (var key of keys_doc) {result[key] = obj_doc[key];}}

  return result
}



