// wrapper for working with user information (creds, access, etc.)
// creds prototype
// cred = {
//   "POS": ["Developer","Head of Staff"],
//   "FILE":{
//     "Scoring System": "edit",
//     "Results": "view",
//     "Templates": "none",
//   },
//   "SCRIPT":{
//     "INIT"    : false,
//     "SPAWN"   : false,
//     "STAFF"   : false,
//     "DOC"     : false,
//     "CHATBOT" : false,
//     "UTIL"    : false,
//   },
// }

// property key: u_${id} (fileument property)

// *************REGISTER MANAGEMENT********************
// the "register" is created as a workaround for restricted authorization under simple Triggers (ex] onOpen)
// there is a method [Session.getTemporaryActiveUserKey()] that returns a unique string for a user, with no authorizations.
// so, there is a "register" property within script properties to use as a dictionary to return the user id. (second resort)
function init_register(){set_prop('register',JSON.stringify({}),'s');}

function get_register(){return JSON.parse(get_prop_value('register','s'))}

function get_id_from_register(temp_string){
  return get_register()[temp_string]
}

function set_register_entry(temp_string,id){
  var register = get_register();
  register[temp_string] = id;
  set_prop('register',JSON.stringify(register),'s');
  Logger.log(`[${id}] registered as [${temp_string}] (${get_now()})`)
}

// *************CREDENTIALS MANAGEMENT********************
function user_get_id(){return Session.getActiveUser().getEmail().split("@")[0];}
function user_get_email(){return Session.getActiveUser().getEmail();}

function is_dev(id = user_get_id()){ //special designation for devs (does not get deleted by 'unpopulate_creds')
  if(id == ""){return false;}
  return get_prop_value('developers','s').split(";").includes(id);
}

function greedy_file_acc(acc1 = "edit",acc2 = "none"){
  if(acc1 == "edit" || acc2 == "edit"){return "edit";}
  if(acc1 == "view" || acc2 == "view"){return "view";}
  return "none"
}

function upload_cred(cred,id = user_get_id(),name = null){
  var prev_cred = get_prop_value(`u_${id}`,'d');
  if(prev_cred == null){prev_cred = {};}

  else{prev_cred = JSON.parse(prev_cred);}
  var new_cred = {"ID":id,"NAME":name,"POS":[],"FILE":{},"SCRIPT":{}};

  var prev_pos = prev_cred["POS"];
  if(prev_pos == null){prev_pos = [];}
  if(prev_pos.includes(cred["POS"][0])){new_cred["POS"] = prev_pos;}
  else{new_cred["POS"] = cred["POS"].concat(prev_pos);}

  var prev_file = prev_cred["FILE"];
  if(prev_file == null){prev_file = {};}
  var prev_file_v = null;
  for(var key in cred["FILE"]){
    prev_file_v = prev_file[key];
    if(prev_file_v == null){prev_file_v = "none";}
    new_cred["FILE"][key] = greedy_file_acc(cred["FILE"][key],prev_file_v);
  }
  
  var prev_script = prev_cred["SCRIPT"];
  if(prev_script == null){prev_script = {};}

  var prev_script_v = null;
  for(var key in cred["SCRIPT"]){
    prev_script_v = prev_script[key];
    if(prev_script_v == null){prev_script_v = false;}
    new_cred["SCRIPT"][key] = cred["SCRIPT"][key] || prev_script_v;
  }

  var s = JSON.stringify(new_cred)
  set_prop(`u_${id}`,s,'d');
  Logger.log(`Uploaded user cred for [${id}]\n:${s}`)
  return new_cred;
}

function populate_creds(dev_only = false){
  var ss = get_ss_spreadsheet()
  var a_pos = ss.getRange("STAFF_POS").getValues()[0];
  var a_file = ss.getRange("STAFF_FILE").getValues();
  var a_script = ss.getRange("STAFF_SCRIPT").getValues();
  var a_email = ss.getRange("STAFF_EMAIL").getValues();

  var pos_cred = {};
  for(var i_col = 2;i_col < a_pos.length;i_col++){
    if(a_pos[i_col] == ""){continue;}
    pos_cred = {
      "POS": [a_pos[i_col],],
      "FILE":{},
      "SCRIPT":{},
    }
    for(var i_file = 0;i_file < a_file.length;i_file++){
      pos_cred["FILE"][a_file[i_file][1]] = a_file[i_file][i_col];
    }
    for(var i_script = 0;i_script < a_script.length;i_script++){
      pos_cred["SCRIPT"][a_script[i_script][1]] = a_script[i_script][i_col];
    }
    // Logger.log(pos_cred);
    var id = null;
    var name = "ANON";
    for(var i_email = 0;i_email < a_email.length;i_email++){
      if(a_email[i_email][i_col] == ""){continue;}
      id = a_email[i_email][i_col].split('@')[0];
      name = a_email[i_email][i_col+1];
      // Logger.log(a_email[i_email][i_col])
      if((!dev_only) || (dev_only && is_dev(id))){upload_cred(pos_cred,id,name);}
    }
  }
}

function unpopulate_creds(do_dev_populate = true){
  delete_props("u_","d",false);
  if(do_dev_populate){populate_creds(true);}
}

function repopulate_creds(){
  unpopulate_creds(false);
  Logger.log("UNPOPULATE COMPLETE")
  populate_creds();
  Logger.log("POPULATE COMPLETE")

}

function read_creds(){
  read_props("u_","d")
}

function get_cred(id = user_get_id()){
  return JSON.parse(get_prop_value(`u_${id}`,'d'))
}

function get_all_creds(){
  var props = get_props('u_','d');
  var creds = {};
  for(var key in props){
    creds[key.slice(2,)] = JSON.parse(props[key])
  }
  // Logger.log(creds);
  return creds;
}

function check_cred(script = "INIT",cred = get_cred(),do_ui = true){
  Logger.log(`PTSS ${VERSION} Script was Run : [${cred["ID"]}] (${cred['POS']})`);
  if(cred["SCRIPT"][script]){return true;}
  Logger.log(`[TERMINATE] User [${cred["ID"]}] does not have required cred: SCRIPT.${script}`);
  return false
}

function sync_access(creds = get_all_creds()){ //gives appropriate access to RESULTS / SCORING SYSTEM / TEMPLATES according to the uploaded cred. info
  var cred = null;
  var file_ss      = DriveApp.getFileById(get_prop_value("ss-id"       ,'d'));
  var file_result  = DriveApp.getFileById(get_prop_value("result-id"   ,'d'));
  var file_template= DriveApp.getFileById(get_prop_value("template-id" ,'d'));

  for(key in creds){
    cred = creds[key]
    Logger.log(`[SYNC] Updating Files Access for [${cred["ID"]}]: ${JSON.stringify(cred["FILE"])}`);

    if     (cred["FILE"]["Scoring System"] == 'view'){file_ss.addViewer(`${cred["ID"]}@gmail.com`);}
    else if(cred["FILE"]["Scoring System"] == 'edit'){file_ss.addEditor(`${cred["ID"]}@gmail.com`);}

    if     (cred["FILE"]["Result"]         == 'view'){file_result.addViewer(`${cred["ID"]}@gmail.com`);}
    else if(cred["FILE"]["Result"]         == 'edit'){file_result.addEditor(`${cred["ID"]}@gmail.com`);}

    if     (cred["FILE"]["Template"]       == 'view'){file_template.addViewer(`${cred["ID"]}@gmail.com`);}
    else if(cred["FILE"]["Template"]       == 'edit'){file_template.addEditor(`${cred["ID"]}@gmail.com`);}
  }
}

function remove_access(){ //removes all access to files (except owner)
  var file_ss      = DriveApp.getFileById(get_prop_value("ss-id"       ,'d'));
  var file_result  = DriveApp.getFileById(get_prop_value("result-id"   ,'d'));
  var file_template= DriveApp.getFileById(get_prop_value("template-id" ,'d'));
  for(var file of [file_ss,file_result,file_template]){
    var editors = file.getEditors();
    var viewers = file.getViewers();
    for (var ed of editors){file.removeEditor(ed);}
    for (var ve of viewers){file.removeViewer(ve);}  
    Logger.log(`Removed Access for [${file.getName()}]: Viewers:[${viewers.map(e => e.getEmail())}], Editors:[${editors.map(e => e.getEmail())}]`);
  }
}

/////////////////////////////////////

function clear_staff(){
  var ssSpreadsheetFile = DriveApp.getFileById(PropertiesService.getDocumentProperties().getProperty('ssId'));
  var resultFolder = DriveApp.getFileById(PropertiesService.getDocumentProperties().getProperty('folderID_result'));
  var templateFolder = DriveApp.getFileById(PropertiesService.getDocumentProperties().getProperty('folderID_template'));

  for(var file of [ssSpreadsheetFile,resultFolder,templateFolder]){
    var editors = file.getEditors();
    var viewers = file.getViewers();
    for (var ed of editors){file.removeEditor(ed);}
    for (var ve of viewers){file.removeViewer(ve);}
  }
}