
/**
 * [ui] Automatically triggered function for opening the document (also when refreshed). Contains all frontend handles
 * @return {null}
 */
function onOpen(){
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
  source_gate(ui,id,cred);

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
      .addItem('Preprocess'             ,`ui_init_preprocess`)
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
      .addItem('Draw'              ,'ui_gen_draw'   )
      .addItem('Scoreboard'        ,'ui_gen_board'  )
      .addItem('Tournament Data'   ,'ui_gen_db'     )
      .addItem('Selection Stage(s)','ui_gen_sel'    )
      .addSeparator()
      .addItem('Summary'           ,'ui_gen_r'      )
      .addSeparator()
      .addItem('Write Template'    ,'ui_gen_wt')
      .addItem('Capture Template'  ,'ui_gen_ct')
      // .addItem('Finals Templates'   ,'ui_gen_templates_f')
      .addToUi();
  }

  function ui_show_chatbot(ui){
    ui.createMenu('CHATBOT')
      .addItem('Activate Chatbot', 'ui_display_chatbot')
      .addToUi();
  }

  function ui_show_util(ui){
    ui.createMenu('UTIL')
      .addItem(`Hide Private Sheets`,'ui_hide_sheets')
      .addItem('Unhide Private Sheets','ui_unhide_sheets')
      .addSeparator()
      .addItem('Hide [FINAL]','ui_hide_final')
      .addItem('Unhide [FINAL]','ui_unhide_final')
      .addSeparator()
      .addItem('Read Properties','ui_read_props')
      .addSeparator()
      .addItem('Make Formulas Relative','ui_make_relative')
      .addItem('Range Specs','ui_range_spec')
      .addItem('Speedometer',"ui_speedometer")
      .addSeparator()
      .addItem('Load Example','ui_load_all')
      .addItem('Clear Example','ui_clear_all')
      .addItem('Full Example Instance','ui_full_example')
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
  ui.alert(`Say hello to [${get_full_name()}]!\nRefresh page to access scripts.\n(PTSS ${VERSION})`);
}

// controlling source integrity
function source_gate(ui,id,cred){
  if(get_prop_value('status','d') != 'SOURCE'){return true;}
  var pass = false;

  var result = ui_prompt(
    "Source Editing Mode","Editing this file will change all future instances. Do you know what you are doing?",
    ButtonSet = ui.ButtonSet.YES_NO,trueButton = ui.Button.YES
  );

  if(is_dev(id) || result == "remember2020"){pass = true;} // if you know what this means, you deserve developer rights.
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
  var doc_file = DriveApp.getFileById(doc.getId());
  var parent_folder = doc_file.getParents().next();

  var html_output = `<div style="font-family:Arial; text-align:center">`;
  html_output += `${doc.getName()}<br><br>`
  html_output += `<a href = "${parent_folder.getUrl()}" target = "_blank">Open Folder</a>  `;
  html_output += `<a href = "${doc.getUrl()}" target = "_blank">Open Doc</a>  `;
  if(pdf != null){html_output += `<a href = "${pdf.getDownloadUrl()}" target = "_blank">Download PDF</a>`;}
  html_output += `</div>`;
  return html_output;
}

function ui_html_dialog(input_html,ui = get_ui(),title = "HTML DIALOG",size = [420,100]){
  ui.showModalDialog(HtmlService.createHtmlOutput(input_html).setWidth(size[0]).setHeight(size[1]), title);
}

// *************** UI functions ***************

// INIT scripts (complete)
function ui_init_preprocess(){
  var ui = get_ui();
  if(!check_cred("INIT")){ui.alert("Unauthorized.");return false;}

  if(!ui_ask(`This script will unspawn this instance, and clear all user input fields. Continue?`)){ui.alert("Cancelled");return false;}
  if(get_prop_value('status','d') != 'SOURCE'){
    if(!ui_ask(`[WARNING] This script is recommended only for SOURCE documents. Continue?`)){ui.alert("Cancelled");return false;}
  }

  unspawn_and_clear();
  return true;

}

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

// STAFF scripts (complete)
function ui_add_staff(){
  var ui = get_ui();
  if(!check_cred("STAFF")){ui.alert("Unauthorized.");return false;}

  if(!ui_ask("This script will give access to all affilated staff. Continue?")){ui.alert("Cancelled");return false;}
  // ui_hide_sheets(); // should we automatically hide sheets when inviting staff members?
  protect_data();
  protect_final();
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

// DOC scripts (complete)
function ui_gen_draw(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  var [doc,pdf] = gen_draw(null,true,true,false);
  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_board(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  var pf = get_ss_spreadsheet().getRange('BOARD_PF').getValue();
  if(!ui_ask(`Generate Scoreboard for PF${pf}?`)){ui.alert("Cancelled. Check [BOARD] for PF number setting.");return false;}
  var [doc,pdf] = gen_board(pf,null,false,true,false);
  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_db(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}

  var [doc,pdf] = gen_db(null,true,true,false);
  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_sel(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}
  
  var [doc,pdf] = gen_sel(null,true,true,false);
  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_r(){
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}

  var result = ui_prompt("Enter [#PF-#Room]/[#PF]","Examples:\n  '2-4': PF2,Room4\n  '3'  : All rooms of PF3\n  'f'  : Final round");
  if(result == false){ui.alert("Cancelled");return;}

  if(result == 'f'){
    var [doc,pdf] = gen_fin_r(null,true,true);
  }
  else if(result.includes("-")){
    var [pf_num,rm_num] = result.split('-');
    var [doc,pdf] = gen_rm_r(null,pf_num,rm_num,null,true,true);
  }
  else{
    var pf_num = result;
    var [doc,pdf] = gen_pf_r(null,pf_num,true,true);
    // if(doc == false){ui.alert(`ERROR: The current scoreboard setting does not match input PF("${pf_num}") (see [BOARD] spreadsheet)`)}
  }

  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_wt(){ //write templates
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}

  var result = ui_prompt("Enter [#PF-#Room]/[#PF]","Examples:\n  '2-4': PF2,Room4\n  '3'  : All rooms of PF3\n  'f'  : Final round");
  if(result == false){ui.alert("Cancelled");return;}

  if(result == 'f'){
    var [doc,pdf] = gen_fin_wt(null,true,true);
  }
  else if(result.includes("-")){
    var [pf_num,rm_num] = result.split('-');
    var [doc,pdf] = gen_rm_wt(null,pf_num,rm_num,null,true,true);
  }
  else{
    var pf_num = result;
    var [doc,pdf] = gen_pf_wt(null,pf_num,true);
  }

  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

function ui_gen_ct(){ //capture templates
  var ui = get_ui();
  if(!check_cred("DOC")){ui.alert("Unauthorized.");return false;}

  var result = ui_prompt("Enter [#PF-#Room]/[#PF]","Examples:\n  '2-4': PF2,Room4\n  '3'  : All rooms of PF3\n  'f'  : Final round");
  if(result == false){ui.alert("Cancelled");return;}

  if(result == 'f'){
    var [doc,pdf] = gen_fin_ct();
  }
  else if(result.includes("-")){
    var [pf_num,rm_num] = result.split('-');
    var [doc,pdf] = gen_rm_ct(null,pf_num,rm_num);
  }
  else{
    var pf_num = result;
    gen_pf_ct(null,pf_num);
    ui.alert("Capture Templates Created. See [TEAMPLATES] Folder.");
    return;
  }

  var doc_html = html_doc_specs(doc,pdf);
  ui_html_dialog(doc_html,ui,"Document(s) Generated")

  return true;
}

// CHATBOT scripts (complete)
function ui_display_chatbot(){
  var ui = get_ui();
  if(!check_cred("CHATBOT")){ui.alert("Unauthorized.");return false;}
  
  var cb_html = HtmlService.createHtmlOutputFromFile('cb_ui').setTitle(`PTSS ${VERSION} Chatbot`);
  ui.showSidebar(cb_html);
  return true;
}

// UTIL scripts (complete)
function ui_hide_sheets(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  var ss = get_ss_spreadsheet();
  var vis= get_visible_sheet_colors();

  for(var sheet of ss.getSheets()){
    if(!vis.includes(sheet.getTabColor())){
      Logger.log(`[UI] Sheet ${sheet.getName()} Hidden.`);
      sheet.hideSheet();
    }
  }

  return true;
}

function ui_unhide_sheets(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  var show_except = ["FINAL","EX_DATA","EX_JURY","EX_ADDITIONAL","EX_FINAL"];
  var ss = get_ss_spreadsheet();

  for(var sheet of ss.getSheets()){
    if(sheet.isSheetHidden() && (!show_except.includes(sheet.getName()) )){
      Logger.log(`[UI] Sheet ${sheet.getName()} Unhidden.`);
      sheet.showSheet();
    }
  }

  return true;
}

function ui_hide_final(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  var ss = get_ss_spreadsheet();
  var sheet = ss.getSheetByName("FINAL");
  sheet.hideSheet();

  return true;
}

function ui_unhide_final(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  var ss = get_ss_spreadsheet();
  var sheet = ss.getSheetByName("FINAL");
  sheet.showSheet();

  return true;
}

function ui_read_props(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}
  
  var s_props = read_props('','sdu',true);
  ui.alert(s_props);
  return true;
}

function ui_range_spec(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  ui.alert(range_spec());
  return true;
}

function ui_speedometer(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  var readout = speedometer();
  ui.alert(readout);
  return true
}

function ui_make_relative(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}
  
  if(!ui_ask('This will affect all formulas within the activated range. Continue?')){ui.alert("Cancelled");return false;}
  make_relative();
  return true;
}

function ui_load_all(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  load_all();
  return true;
}

function ui_clear_all(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  clear_all();
  return true;
}

function ui_full_example(){
  var ui = get_ui();
  if(!check_cred("UTIL")){ui.alert("Unauthorized.");return false;}

  unspawn_and_clear();
  load_and_spawn();

  return true;
}
