
/**
 * [ui] Automatically triggered function for opening the document (also when refreshed). Contains all frontend handles
 * @return {null}
 */
function onOpen(){
  var ui = get_ui();
  Logger.log(`This file was opened by: [${user_get_id()}]`);

  // INIT (initial)
  if(is_new()){
    ui.createMenu("INITIALIZE")
      .addItem('Initialize Scoring System','initGate') //TODO: implement initGate
      .addToUi();
    ui.alert('This document was opened for the first time. Please Initialize with the dropdown menu above.')
    return;    
  }
  // INIT
  ui.createMenu('INIT')
    .addItem('External (new instance)','dev_init_external') //TODO: dev_init_external
    .addItem('Internal (metadata)'    ,'dev_init_internal') //TODO: dev_init_internal
    .addToUi();

  // GEN
  ui.createMenu('GEN')
    .addItem('Populate DATA','dev_populate_data')
    .addItem('Unpopulate DATA','dev_unpopulate_data')
    .addItem('Repopulate DATA','dev_repopulate_data')
    .addItem('Refresh Cell Values','dev_refresh_ss')
    .addToUi();
  
  // STAFF
  ui.createMenu('STAFF')
    .addItem("Add Staff",'dev_add_staff') //TODO
    .addItem('Clear Staff','dev_clear_staff') //TODO
    .addToUi();
  
  // DOC
  ui.createMenu('DOC') //TODO(messy)
    .addItem('Draw','user_gen_draw')
    .addItem('Leaderboard Status','user_gen_pf_status')
    .addItem('Tournament Progression Status','user_gen_database')
    .addItem('PF4 Questions Verdict','user_gen_pf4_problems')
    .addItem('PF##, RM##', 'user_gen_pfrm')
    .addItem('Total Summary of PF','user_gen_pf_summary')
    .addItem('Finals','user_gen_final')
    .addSeparator()
    .addItem('Write Templates','user_gen_write_template_all')
    .addItem('Capture Templates','user_gen_capture_templates')
    .addItem('Finals Templates','user_gen_write_template_final')
    .addToUi();

  // CHATBOT
  ui.createMenu('CHATBOT')
    .addItem('Activate Chatbot', 'user_show_chatbot')
    .addToUi();

  // UTIL
  ui.createMenu('UTIL')
    .addItem('make_relative','make_relative') //TODO: direct porting?
    .addToUi();


}

/**
 * [ui] Check in the open of document of this script needs to be initialized. (Different logical flow)
 * 
 * @return {boolean} if the gate is passed
 */
function initGate(){
  // if(PropertiesService.getDocumentProperties().getProperty('status') == null){
  //   Logger.log("This file was initialized by: " + Session.getActiveUser().getEmail() +" ");
  //   Logger.log("Internal Initialize Called (first time open)");
  //   read_all_properties();
  //   init_internal();
  //   Logger.log("System Initialized Sucessfully.");
  //   ui.alert(`Welcome to ${PropertiesService.getDocumentProperties().getProperty('category')}-${PropertiesService.getDocumentProperties().getProperty('callname')} Scoring System!\n Refresh page to access scripts.`)
  //   // onOpen();
  //   return false
  // }
  // else if(PropertiesService.getDocumentProperties().getProperty('status') == 'SOURCE'){
  //   var result = promptUser(
  //     "Source Editing Mode","Editing this file will change all future instances. Do you know what you are doing?",
  //     ButtonSet = ui.ButtonSet.YES_NO,trueButton = ui.Button.YES
  //   );
  //   if(result != PropertiesService.getScriptProperties().getProperty('_devPw') &&
  //     PropertiesService.getScriptProperties().getProperty('developers').search(Session.getActiveUser().getEmail()) == -1){
  //       ui.alert("Authentication Unsuccessful.");
  //       Logger.log("SOURCE authentication FAILED at: "+now);
  //       return false
  //   }
  //   Logger.log("SOURCE authentication successful at: "+now);
  //   return true
  // }
  // return true
}

/**
 * [ui] Credential check on frontend for authorization in certain functions
 * 
 * @param {string} mode supported modes: 'dev' (developer only access), 'user" (public access)
 * @return{boolean} returns true if gate is passed
 */
function userGate(mode = 'user'){
  // Logger.log("KYPT Scoring System Script was Run : " + Session.getActiveUser().getEmail() + " as " + mode);
  // if(mode.search('dev') != -1){
  //   if(Session.getActiveUser().getEmail() == ''){}
  //   else if(PropertiesService.getScriptProperties().getProperty('developers').search(Session.getActiveUser().getEmail()) != -1){
  //     return true
  //   }
  //   var result  = promptUser("Developer Sign-In","Your credentials are not recognized as developer. Please enter Password.");
  //   if(result == PropertiesService.getScriptProperties().getProperty('_devPw')){
  //     return true
  //   }
  //   ui.alert("Invalid Password. Access Denied.");
  //   Logger.log("User Failed Developer Identification");
  //   return false;
  // }
  // else if(mode.search('user') != -1){
  //   return true;
  // }
  // return false;
}

/**
 * [ui] Wrapper for text input dialog boxes
 * 
 * @param {string} title the title of dialog box
 * @param {string} subtitle subtitle or description in dialog box
 * @param {ButtonSet} buttons the button set to use
 * @param {Button} trueButton the botton that corresponds to true
 * @return{(boolean|string)} returns the input text if the trueButton is pressed, false if not.
 */
function promptUser(title,subtitle,buttons = get_ui().ButtonSet.OK_CANCEL,trueButton = get_ui().Button.OK){  
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
function askUser(text,ButtonSet = get_ui().ButtonSet.YES_NO,trueButton = get_ui().Button.YES){
  var ui = get_ui();
  if(ui.alert(text,ButtonSet) == trueButton){
    return true;
  }
  return false;
}


function htmlString_result(doc,pdf){
  return '<div style="font-family:Arial; text-align:center">'+doc.getName()+'<br><br><a href = "'+
    PropertiesService.getDocumentProperties().getProperty('folderURL_result')+
      '" target = "_blank">Open Folder</a>  <a href = "'+
        doc.getUrl()+
          '"target = "_blank">Open Docs</a>  <a href = "'+
            pdf.getDownloadUrl()+
              '">Download PDF</a> </div>';
}

function dev_populate_data(){
  var ui = get_ui();
  if(userGate('dev') == false){return false;}
  populate_data()
  ui.alert("Run [Refresh Cell Values] to have formulas working")
  return true
}

function dev_unpopulate_data(){
  if(userGate('user') == false){return false;}  
  unpopulate_data()
  return true
}

function dev_repopulate_data(){
  var ui = get_ui();
  if(userGate('user') == false){return false;}  
  repopulate_data()
  ui.alert("Run [Refresh Cell Values] to have formulas working")
  return true
}

function dev_refresh_ss(){
  if(userGate('user') == false){return false;} 
  refresh_calc(); 
  SpreadsheetApp.flush()
  return true
}

function user_show_chatbot() {
  var ui = get_ui();
  if(userGate('user') == false){return false;}
  var html = HtmlService.createHtmlOutputFromFile('cb_ui').setTitle('PTSS Chatbot');
  ui.showSidebar(html);
}