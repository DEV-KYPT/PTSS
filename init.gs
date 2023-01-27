function init_external (category = "TEST",callname = get_now()){ //callname is allocated to: "Draw!I26"
  // CALLED ONLY from SOURCE.

  if(get_prop_value('status','d') != 'SOURCE'){
    Logger.log("Invalid Initialize Root.")
    ui.alert("New Tournament Instances can only be created from SOURCE.");
    return;}
  Logger.log("NEW TOURNAMENT INITIALIZED : "+category+"-"+callname);

  var ss = get_ss_spreadsheet();
  var meta_prop_len = ss.getRange("META_PROP").getValues().length

  const ss_name = `[${category}-${callname}] PTSS ${VERSION}`;

  // locate / create folders
  var origin       = DriveApp.getFolderById(get_prop_value("origin-id"))
  var new_root     = origin.createFolder(`[${category}-${callname}] Scoring System `+VERSION);
  var new_result   = new_root.createFolder("RESULT");
  var new_template = new_root.createFolder("TEMPLATE");

  // copy SOURCE into new root
  var new_ss_file  = DriveApp.getFileById(get_prop_value("ss-id","d")).makeCopy(ss_name,new_root);
  var new_ss       = SpreadsheetApp.openById(new_ss_file.getId());

  new_ss_file.setShareableByEditors(false);

  new_result  .setShareableByEditors(false);
  new_template.setShareableByEditors(false);
  
  // populate metadata for new sheet.
  var ext_props = [
    ['d','status'      ,`[${category}-${callname}] init from <${get_prop_value("status")}> at [${get_now()}]`],
    ['d','ss-id'       ,new_ss_file.getId()],
    ['d','ss-url'      ,new_ss_file.getUrl()],
    ['d','root-id'     ,new_root.getId()],
    ['d','root-url'    ,new_root.getUrl()],
    ['d','origin-id'   ,origin.getId()],
    ['d','origin-url'  ,origin.getUrl()],
    ['d','template-id' ,new_template.getId()],
    ['d','template-url',new_template.getUrl()],
    ['d','result-id'   ,new_result.getId()],
    ['d','result-url'  ,new_result.getUrl()]
    // ['d','',],    
  ]

  // resize value array with blanks
  while(ext_props.length < meta_prop_len){ext_props.push(['','',''])}

  new_ss.getRange("META_PROP").setValues(ext_props)

  // also populate version & name information
  new_ss.getRange("META_CATEGORY").setValue(category)
  new_ss.getRange("META_CALLNAME").setValue(callname)

  Logger.log("EXTERNAL INITIALIZATION SUCCESSFUL. NEW TOURNAMENT CREATED");
}

function init_internal(){
  Logger.log("Internal Initialization Called at: "+get_now());

  var ss = get_ss_spreadsheet();
  var prop_raw = ss.getRange("META_PROP").getValues();
  // Logger.log(prop_raw)
  var props_s = {}
  var props_d = {}
  var props_u = {}
  for(var entry of prop_raw){
    if(entry[0]=="s"){props_s[entry[1]]=entry[2]}
    if(entry[0]=="d"){props_d[entry[1]]=entry[2]}
    if(entry[0]=="u"){props_u[entry[1]]=entry[2]}
  }

  // Logger.log(props_s)
  // Logger.log(props_d)
  // Logger.log(props_u)
  set_properties(props_s,"s")
  set_properties(props_d,"d")
  set_properties(props_u,"u")

  // also propagate version information backwards (useful redundancy for working with SOURCE).
  ss.getRange("META_VERSION").setValue(VERSION);
  ss.rename(`[${ss.getRange("META_CATEGORY").getValue()}-${ss.getRange("META_CALLNAME").getValue()}] PTSS ${VERSION}`)

  Logger.log("Internal Initialization Successful.");
  read_all_properties();
}

//TODO: Duplicate Capability
//TODO: STAFF ADMIN

