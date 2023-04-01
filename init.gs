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

  new_ss_file .setShareableByEditors(false).setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);;
  new_result  .setShareableByEditors(false).setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);;
  new_template.setShareableByEditors(false).setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);;

  // new_ss_file.setSharing();

  // populate metadata for new sheet.
  var ext_props = [
    ['d','status'      ,`[${category}-${callname}] init from <${get_prop_value("status")}> at [${get_now()}]`],
    ['d','category'    ,category], //!! this has to be the second line!
    ['d','callname'    ,callname], //!! this has to be the third line!
    ['d','ss-id'       ,new_ss_file.getId()],
    ['d','ss-url'      ,new_ss_file.getUrl()],
    ['d','root-id'     ,new_root.getId()],
    ['d','root-url'    ,new_root.getUrl()],
    ['d','origin-id'   ,origin.getId()],
    ['d','origin-url'  ,origin.getUrl()],
    ['d','template-id' ,new_template.getId()],
    ['d','template-url',new_template.getUrl()],
    ['d','result-id'   ,new_result.getId()],
    ['d','result-url'  ,new_result.getUrl()],
    ['s','developers'  ,"iamchoking247;korea.kypt"],
    ['s','register'    ,'{}']
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

function is_new(){ //check if internal init is done in current document (true if there are no props set)
  return get_prop_value('status','d') == null;
}

function init_internal(){
  Logger.log("Internal Initialization Called at: "+get_now());

  // [01] Set data in "META" spreadsheet correctly into PropertiesService
  var ss = get_ss_spreadsheet();

  var prop_raw = ss.getRange("META_PROP").getValues();
  // Logger.log(prop_raw)
  var props_s = {}
  var props_d = {}
  var props_u = {}
  for(var entry of prop_raw){
    if(entry[0]=="s"){props_s[entry[1]]=String(entry[2])}
    if(entry[0]=="d"){props_d[entry[1]]=String(entry[2])}
    if(entry[0]=="u"){props_u[entry[1]]=String(entry[2])}
  }
  // props_d["category"]=String(ss.getRange("META_CATEGORY").getValue());
  // props_d["callname"]=String(ss.getRange("META_CALLNAME").getValue());

  // Logger.log(props_s)
  // Logger.log(props_d)
  // Logger.log(props_u)
  set_props(props_s,"s")
  set_props(props_d,"d")
  set_props(props_u,"u")

  // [02] set scoring system name /  folder name properly
  const ss_name = `[${get_full_name()}] PTSS ${VERSION}`;

  var root_name = null;
  if(get_prop_value('status','d') == 'SOURCE'){root_name = `[${get_full_name()}] ${VERSION}`}
  else                                        {root_name = `[${get_full_name()}] Scoring System ${VERSION}`}
  
  ss.rename(ss_name);

  var root_folder = DriveApp.getFileById(get_prop_value('root-id','d'))
  root_folder.setName(root_name);

  // [03] also propagate version information backwards (useful redundancy for working with SOURCE).
  ss.getRange("META_VERSION").setValue(VERSION);
  ss.rename(`[${get_full_name()}] PTSS ${VERSION}`)

  populate_creds(true); //populate credentials for developers

  Logger.log("Internal Initialization Successful.");
  read_props();
}

//TODO: Duplicate Capability

