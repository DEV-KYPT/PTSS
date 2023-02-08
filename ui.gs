
/**
 * [ui] Automatically triggered function for opening the document (also when refreshed). Contains all frontend handles
 * @return {null}
 */
function onOpen(){ // TODO: implement workaround with Session.getTemporaryActiveUserKey() 
  var ui   = get_ui();
  var id   = user_get_id();
  var temp_string = '';

  // INIT (initial)
  if(is_new()){
    ui.createMenu("INITIALIZE")
      .addItem('Initialize Scoring System','new_init')
      .addToUi();
    ui.alert('This document was opened for the first time.\nPlease boot the system the dropdown menu above.')
    return;    
  }

  if(id == ''){
    temp_string = Session.getTemporaryActiveUserKey();
    id = get_id_from_register(temp_string);
    if(id == null){id = 'ANON'}
  }
  Logger.log(`${get_full_name()} (PTSS ${VERSION}) was opened. [${id}]`);
  if(id == "ANON"){ //anonymous user or first time opening for this user
    ui.createMenu(`PTSS ${VERSION}`)
      .addItem('Activate','ui_activate')
      .addToUi()
    ui.alert(`Welcome to PTSS ${VERSION}!\nActivate scripts with the dropdown menu above.\n(Press ["PTSS ${VERSION}"] > [Activate])`);
    return;
  }

  var cred = get_cred(id);
  Logger.log(`User: [${cred['NAME']}] <${id}> (${cred['POS']}) {${temp_string}}`);

  // Gate for source
  source_gate(ui,id,cred); // TODO make source_gate possible in onOpen context

  // INIT
  if(cred["SCRIPT"]["INIT"]){ui_show_init(ui);}
  // ui_show_init(ui);

  // SPAWN
  if(cred["SCRIPT"]["SPAWN"]){ui_show_spawn(ui);}
  // ui_show_spawn(ui);

  // STAFF
  if(cred["SCRIPT"]["STAFF"]){ui_show_staff(ui);}
  // ui_show_staff(ui);

  // DOC
  if(cred["SCRIPT"]["DOC"]){ui_show_doc(ui);}
  // ui_show_doc(ui);

  // CHATBOT
  if(cred["SCRIPT"]["CHATBOT"]){ui_show_chatbot(ui);}
  // ui_show_chatbot(ui);

  // UTIL
  if(cred["SCRIPT"]["UTIL"]){ui_show_util(ui);}
  // ui_show_util(ui);

}

// ui menu-adding functions

  function ui_show_init(ui){
    ui.createMenu('INIT')
      .addItem('External (new instance)','ui_init_external')
      .addItem('Internal (metadata)'    ,'ui_init_internal')
      .addToUi();
  }

  function ui_show_spawn(ui){
    ui.createMenu('SPAWN')
      .addItem('Spawn Instance'      ,'ui_spawn'     )
      .addItem('Unspawn Instance'    ,'ui_unspawn'   )
      .addItem('Respawn Instance'    ,'ui_respawn'   )
      .addItem('Refresh Cell Values' ,'ui_refresh_ss')
      .addToUi();
  }

  function ui_show_staff(ui){
    ui.createMenu('STAFF')
      .addItem("Add Staff",'ui_add_staff')
      .addItem('Clear Staff','ui_clear_staff') 
      .addToUi();
  }

  function ui_show_doc(ui){
    ui.createMenu('DOC')
      .addItem('Draw'            ,'ui_gen_draw'   )
      .addItem('Scoreboard'      ,'ui_gen_board'  )
      .addItem('Tournament Data' ,'ui_gen_db'     )
      .addItem('Selection Stages','ui_gen_sel'    )
      .addItem('Room Summary'    ,'ui_gen_rm'     )
      .addItem('PF Summary'      ,'ui_gen_pf'     )
      .addItem('Final Round'     ,'ui_gen_fin'    )
      .addSeparator()
      .addItem('Write Templates'  ,'ui_gen_templates_w')
      .addItem('Capture Templates','ui_gen_templates_c')
      // .addItem('Finals Templates' ,'ui_gen_templates_f')
      .addToUi();
  }

  function ui_show_chatbot(ui){
    ui.createMenu('CHATBOT')
      .addItem('Activate Chatbot', 'ui_display_chatbot')
      .addToUi();
  }

  function ui_show_util(ui){
    ui.createMenu('UTIL')
      .addItem('Make Formulas Relative','ui_make_relative')
      .addItem('Read Properties','ui_read_props')
      .addToUi();
  }

//

// function for new document initialization
function new_init(){
  var ui = get_ui();
  // var id = user_get_id();
  // var cred = get_cred();  
  Logger.log(`This file was initialized by: ${user_get_id()}`);
  init_internal();
  ui.alert(`Say hello to [${get_full_name}]!\nRefresh page to access scripts.\n(PTSS ${VERSION})`);
}

// controlling source integrity
function source_gate(ui,id,cred){
  if(get_prop_value('status','d') != 'SOURCE'){return true;}
  var pass = false;

  var result = ui_prompt(
    "Source Editing Mode","Editing this file will change all future instances. Do you know what you are doing?",
    ButtonSet = ui.ButtonSet.YES_NO,trueButton = ui.Button.YES
  );

  if(is_dev(id) || result == "rememberkypt2020"){pass = true;} // if you know what this means, you deserve developer rights.
  if(result == "sabotage"){pass = false;}

  if(pass){
    Logger.log(`SOURCE authentication SUCCESS: id:${id}`);
    return true;
  }
  Logger.log(`SOURCE authentication FAILED: id:${id}`);
  // jam the ui if not passed.
  while(true){ui.alert("Authentication Unsuccessful.");}
}

// first-time activation function (grants permissions)
function ui_activate(){
  var id = user_get_id();
  var temp_string = Session.getTemporaryActiveUserKey();

  if(id == ''){ui.alert('Cannot use scripts anonymously');return false;}

  set_register_entry(temp_string,id);
  var cred = get_cred(id);
  Logger.log(`[ACTIVATE] User [${id}] was activated with key [${temp_string}]`)
  get_ui().alert(`Activation Successful\n[${cred['NAME']}] <${id}> (${cred['POS']})\nRefresh Page to access scripts.`);
}

// wrappers for ui elements
/**
 * [ui] Wrapper for text input dialog boxes
 * 
 * @param {string} title the title of dialog box
 * @param {string} subtitle subtitle or description in dialog box
 * @param {ButtonSet} buttons the button set to use
 * @param {Button} trueButton the botton that corresponds to true
 * @return{(boolean|string)} returns the input text if the trueButton is pressed, false if not.
 */
function ui_prompt(title,subtitle,buttons = get_ui().ButtonSet.OK_CANCEL,trueButton = get_ui().Button.OK){  
  var ui = get_ui();
  var result = ui.prompt(title,subtitle,buttons);
  if (result.getSelectedButton()==trueButton){
    return result.getResponseText();
  }
  return false;
}

/**
 * [ui] Wrapper for yes/no dialog boxes
 * 
 * @param {string} text text to display on dialog box
 * @param {ButtonSet} buttons the button set to use
 * @param {Button} trueButton the botton that corresponds to true
 * @return{boolean} returns if the trueButton is pressed
 */
function ui_ask(text,ButtonSet = get_ui().ButtonSet.YES_NO,trueButton = get_ui().Button.YES){
  var ui = get_ui();
  if(ui.alert(text,ButtonSet) == trueButton){
    return true;
  }
  return false;
}

// html maker for ui display
function html_doc_specs(doc,pdf){
  var html_output = `<div style="font-family:Arial; text-align:center">"`;
  html_output += `${doc.getName()}<br><br>`
  html_output += `<a href = "${get_prop_value("result-url")}" target = "_blank">Open Folder</a>  `;
  html_output += `<a href = "${doc.getUrl()}" target = "_blank">Open Doc</a>  `;
  html_output += `<a href = "${pdf.getDownloadUrl()}" target = "_blank">Download PDF</a>`;
  html_output += `</div>`;
  return html_output;
}


// *************** UI functions ***************

// INIT scripts (complete)
function ui_init_external(){
  var ui = get_ui();
  if(!check_cred("INIT")){ui.alert("Unauthorized.");return false;}

  if(is_spawned()){ui.alert("SOURCE must be unspawned to create new Instance.");return false;}

  var input = ui_prompt(`Enter Tournament Name ([Category-Callname])"`,`"KYPT-2023", "I-YPT-2020", etc.`);
  if(input == false){ui.alert("Cancelled");return false;}
  var category = input.split('-')[0];
  var callname = input.split('-')[1];

  if(!ui_ask(`Create Tournament Instance [${category}-${callname}] ?`)){ui.alert("Cancelled");return false;}

  init_external(category,callname);
  ui.alert(`Tournament Instance [${category}-${callname}] Successfully Created.`)
  return true;
}

function ui_init_internal(){
  var ui = get_ui();
  if(!check_cred("INIT")){ui.alert("Unauthorized.");return false;}
  
  init_internal();
  return true;
}

// SPAWN scripts (complete)
function ui_spawn(){
  var ui = get_ui();
  if(!check_cred("SPAWN")){ui.alert("Unauthorized.");return false;}

  if(!ui_ask("This script will take a few minutes to run. Are you ready to proceed?")){ui.alert("SPAWN Cancelled");return false;}
  spawn();
  ui.alert("Run [SPAWN]>[Refresh Cell Values] to activate spreadsheet formulas.")
  return true;
}

function ui_unspawn(){
  var ui = get_ui();
  if(!check_cred("SPAWN")){ui.alert("Unauthorized.");return false;}

  if(!ui_ask("This script will delete all DATA except PF1-RM1. Are you sure?")){ui.alert("UNSPAWN Cancelled");return false;}  
  unspawn();
  return true;
}

function ui_respawn(){
  var ui = get_ui();
  if(!check_cred("SPAWN")){ui.alert("Unauthorized.");return false;}
  
  if(!ui_ask("This script will take a few minutes to run / overwrite all data in tournament with that of PF1-RM1.Are you ready to proceed?")){ui.alert("RESPAWN Cancelled");return false;}
  respawn();
  ui.alert("Run [SPAWN]>[Refresh Cell Values] to activate spreadsheet formulas.")
  return true;
}

function ui_refresh_ss(){
  var ui = get_ui();
  if(!check_cred("SPAWN")){ui.alert("Unauthorized.");return false;}

  refresh_calc(); 
  SpreadsheetApp.flush();
  return true;
}

// STAFF scripts
function ui_add_staff(){
  var ui = get_ui();
  if(!check_cred("STAFF")){ui.alert("Unauthorized.");return false;}

  if(!ui_ask("This script will give access to all affilated staff. Continue?")){ui.alert("Cancelled");return false;}
  repopulate_creds();
  sync_access();
  get_ui().alert("Staff members added.");
  return true;
}

function ui_clear_staff(){
  var ui = get_ui();
  if(!check_cred("STAFF")){ui.alert("Unauthorized.");return false;}
  
  if(!ui_ask("This script will remove access to PTSS files from everone. Continue?")){ui.alert("Cancelled");return false;}
  remove_access();
  unpopulate_creds();
  return true;
}

/**function dev_clear_staff(){
  if(userGate('dev') == false){return false;}
  var result = askUser('Clear all staff members? They will lose all access to documents.');
  if(! result){
    ui.alert('Canceled');
    return false;
  }
  clear_staff();
  ui.alert("All staff members cleared");
} */

// DOC scripts
function ui_gen_draw(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** function user_gen_draw(){
  if(userGate('user') == false){return false;}
  var [doc,pdf] = gen_draw();
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');
}*/

function ui_gen_board(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** function user_gen_pf_status(){
  if(userGate('user') == false){return false;}
  var [doc,pdf] = gen_pf_status();
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');
}*/

function ui_gen_db(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** 
function user_gen_database(){
  if(userGate('user') == false){return false;}
  var [doc,pdf] = gen_database();
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');
}*/

function ui_gen_sel(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/**function user_gen_pf4_problems(){
  if(userGate('user') == false){return false;}
  var [doc,pdf] = gen_pf4_problems();
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');  
}
 */

function ui_gen_rm(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/**function user_gen_pfrm(){
  if(userGate('user') == false){return false;}
//  ui.alert("user_gen_pfrm() called");
  var pf = ui_prompt("Enter PF Number","1,2,3,etc.");
  var rm = ui_prompt("Enter Room Number","1,2,3 etc.");
  var [doc,pdf] = gen_pfrm(pf,rm,undefined,true,true);
  //ui.alert(`Document Successfully Generated!\n${  DriveApp.getFolderById(PropertiesService.getDocumentProperties().getProperty('folderID_result')).getUrl()}`);
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');
} */

function ui_gen_pf(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/**function user_gen_pf_summary(){
  if(userGate('user') == false){return false;}
  var pf = ui_prompt("Enter PF Number","1,2,3,etc.");
  var total_rm = ui_prompt("Enter Total Number of Rooms","1,2,3 etc.");
  var [doc,pdf] = gen_pf_summary(pf,total_rm,true,true);
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Document Generation Successful');
}
 */

function ui_gen_fin(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** */

function ui_gen_templates_w(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** 
function user_gen_write_template_all(){
  if(userGate('user') == false){return false;}
  var total_pf = ui_prompt("Enter Total Number of PF's","1,2,3,etc.");
  var total_rm = ui_prompt("Enter Total Number of Rooms","1,2,3 etc.");
  var [doc,pdf] = gen_write_template_all(total_pf,total_rm,true,true);
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlString_result(doc,pdf)).setWidth(420).setHeight(100), 'Template Generation Successful');
}*/

function ui_gen_templates_c(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  get_ui().alert("TODO");
  return true;
}

/** function user_gen_capture_templates(){
  if(userGate('user') == false){return false;}
  //gen_capture_templates(total_pf = 4,total_rm = 6,docs = true,pdf = false)
  var total_pf = ui_prompt("Enter Total Number of PF's","1,2,3,etc.");
  var total_rm = ui_prompt("Enter Total Number of Rooms","1,2,3 etc.");
  gen_capture_templates(total_pf,total_rm,true,false);
  ui.alert(`Capture templates successfully generated. Check [TEMPLATES] folder`);
}
*/


// CHATBOT scripts (complete)
function ui_display_chatbot(){
  var ui = get_ui();
  if(!check_cred("CHATBOT")){ui.alert("Unauthorized.");return false;}
  
  var cb_html = HtmlService.createHtmlOutputFromFile('cb_ui').setTitle(`PTSS ${VERSION} Chatbot`);
  ui.showSidebar(cb_html);
  return true;
}

// UTIL scripts (complete)
function ui_make_relative(){
  var ui = get_ui();
  if(!check_cred("CHATBOT")){ui.alert("Unauthorized.");return false;}
  
  if(!ui_ask('This will affect all formulas within the activated range. Continue?')){ui.alert("Cancelled");return false;}
  make_relative();
  return true;
}

function ui_read_props(){
  var ui = get_ui();
  if(!check_cred("CHATBOT")){ui.alert("Unauthorized.");return false;}
  
  var s_props = read_props('','sdu',true);
  ui.alert(s_props);
  return true;
}

