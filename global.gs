/////////////////////////VARIABLES/////////////////////////
/**
 * [global] The version number.
 * @type {string}
 */
const VERSION = 'v1.0.0' //all version info's displayed reference this string

function get_ui(){
  try{
    /**
     * [global] The handle for the current ui (independent to spreadsheet or sheet, etc.)
     * @type {Ui}
     */
    var ui = SpreadsheetApp.getUi();
  }catch (error) {
    Logger.log('Exception in Fetching UI: \n' + error);
  }
  return ui;
}

/**
 * [global] retrieves the scoring system spreadsheet
 * @return {SpreadsheetApp.Spreadsheet} the spreadsheet
 */
function get_ss_spreadsheet(){return SpreadsheetApp.getActive();}

/**
 * [global] The time of excecution summarized as "yyyy-MM-dd-HH:mm"
 * @return {String} the time
 */
function get_now(seconds = false) {
  //  timezone = "GMT+" + new Date().getTimezoneOffset()/60
  timezone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  if(seconds){date = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd-HH:mm:ss.SSS");}
  else       {date = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd-HH:mm");}
  return date;
}

function get_milisec(){
  var t = new Date();
  return t.getTime().toFixed(0)
}

/**
 * [global] Fetches all named ranges (type:namedRange) with specified name and exactness
 * 
 */
function get_nr(name,name2 = '',exact = false) {
  var nr_raw = SpreadsheetApp.getActive().getNamedRanges();
  // Logger.log(nr_raw)
  var nrs = [];
  if(name == undefined){return nr_raw;}
  for(var nr of nr_raw){
    if(exact){if(nr.getName()==name){return nr;}}
    else if(nr.getName().includes(name) && nr.getName().includes(name2)){
      nrs.push(nr)
    }
  }
  return nrs
}

function get_full_name(){
  return `${get_prop_value("category",'d')}-${get_prop_value("callname",'d')}`
}

function get_cache_expiration(){return 600;} //cache expiration time in seconds

function get_visible_sheet_colors(){
  return ["#000000","#ff0000","#ff00ff","#0000ff"]
}
