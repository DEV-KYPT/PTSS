function data_load_ex(as_relative = true){
  Logger.log(`[LOAD-DATA] Loading DATA with example`);
  if(is_spawned()){Logger.log("[LOAD] Illegal Load Detected");return;}
  var ss = get_ss_spreadsheet();
  var r = new Rm(1,1);
  r.parse(1);
  var notations = r.get_uin();

  sheet_data = ss.getSheetByName("DATA");
  sheet_ex_data = ss.getSheetByName("EX_DATA");

  var temp = null;
  for(var a1 of notations){
    if(as_relative){temp = make_relative(sheet_ex_data.getRange(a1),false,false);}
    else           {temp = get_content(sheet_ex_data.getRange(a1));}
    sheet_data.getRange(a1).setValues(temp);
  }
  Logger.log(`[LOAD-DATA] Complete.`);
}

function data_clear(){
  Logger.log(`[CLEAR-DATA] Started.`);

  if(is_spawned()){Logger.log("[CLEAR-DATA] Illegal Clear Detected");return;}
  var ss = get_ss_spreadsheet();
  var r = new Rm(1,1);
  r.parse(1);
  var notations = r.get_uin();
  sheet_data = ss.getSheetByName("DATA");
  var rl = sheet_data.getRangeList(notations);
  rl.clearContent();
  Logger.log(`[CLEAR-DATA] Complete.`);

}

function ex_data_save_peripheral(){
  var ss = get_ss_spreadsheet();
  data_load_ex(false);
  ss.getRange("DATA_P1R1_FULL").copyTo(ss.getRange("EX_DATA_FULL"),SpreadsheetApp.CopyPasteType.PASTE_COLUMN_WIDTHS);
  ss.getRange("DATA_P1R1_FULL").copyTo(ss.getRange("EX_DATA_FULL"),SpreadsheetApp.CopyPasteType.PASTE_NORMAL);

  // copy DATA_P1R1_FULL to EX_DATA_FULL
  data_clear()
}

function final_load_ex(as_relative = true){
  Logger.log(`[LOAD-FINAL] Loading FINAL with example.`);

  var ss = get_ss_spreadsheet();
  var r = new Finrm();
  r.parse(1);
  var notations = r.get_uin();

  sheet_final = ss.getSheetByName("FINAL");
  sheet_ex_final = ss.getSheetByName("EX_FINAL");
  // Logger.log(notations);

  // Logger.log(""+r)

  var temp = null;
  for(var a1 of notations){
    if(as_relative){temp = make_relative(sheet_ex_final.getRange(a1),false,false);}
    else           {temp = get_content(sheet_ex_final.getRange(a1));}
    sheet_final.getRange(a1).setValues(temp);
  }
  Logger.log(`[LOAD-FINAL] Complete.`);

}


//TODO!!: Logger outputs for status

function final_clear(){
  Logger.log(`[CLEAR-FINAL] Started.`);

  var ss = get_ss_spreadsheet();
  var r = new Finrm();
  r.parse(1);
  var notations = r.get_uin();
  sheet_data = ss.getSheetByName("FINAL");
  var rl = sheet_data.getRangeList(notations);
  rl.clearContent();
  Logger.log(`[CLEAR-FINAL] Complete.`);

}

function ex_final_save_peripheral(){
  var ss = get_ss_spreadsheet();
  final_load_ex(false);

  ss.getRange("FINAL_FULL").copyTo(ss.getRange("EX_FINAL_FULL"),SpreadsheetApp.CopyPasteType.PASTE_COLUMN_WIDTHS);
  ss.getRange("FINAL_FULL").copyTo(ss.getRange("EX_FINAL_FULL"),SpreadsheetApp.CopyPasteType.PASTE_NORMAL);

  final_clear()
}

function additional_load(){
  var ss = get_ss_spreadsheet();
  var sheet_src = ss.getSheetByName("EX_ADDITIONAL");
  var headers = [null].concat(sheet_src.getRange("1:1").getValues()[0]);

  var target_range = null;
  // var src_range = null;
  var src_values = null;
  var size = [null,null];

  for(var col = 1;col < headers.length;col++){
    if(headers[col] == ""){continue;}
    target_range = ss.getRange(headers[col]);
    size = [target_range.getNumRows(),target_range.getNumColumns()];
    src_values = sheet_src.getRange(2,col,size[0],size[1]).getValues();
    target_range.setValues(src_values);
    // src_range.copyTo(target_range);
    Logger.log(`[LOAD+] Loaded Range ${headers[col]}`);
  }
}

function additional_clear(){
  var ss = get_ss_spreadsheet();
  var sheet_src = ss.getSheetByName("EX_ADDITIONAL");
  var headers = [null].concat(sheet_src.getRange("1:1").getValues()[0]);

  var target_range = null;
  var src_range = null;
  var size = [null,null];

  for(var col = 1;col < headers.length;col++){
    if(headers[col] == ""){continue;}
    ss.getRange(headers[col]).clearContent();
    Logger.log(`[CLEAR+] Cleared Range ${headers[col]}`);
  }
}

function load_all(){
  additional_load();
  data_load_ex();
  final_load_ex();
}

function clear_all(){
  additional_clear();
  data_clear();
  final_clear();
}

function load_and_spawn(){
  load_all();
  spawn();
}

function unspawn_and_clear(){
  unspawn();
  clear_all();
}