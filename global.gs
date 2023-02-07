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
function get_now() {
  //  timezone = "GMT+" + new Date().getTimezoneOffset()/60
  timezone = SpreadsheetApp.getActive().getSpreadsheetTimeZone()
  var date = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd-HH:mm");
  return date;
}

/**
 * [global] Fetches all named ranges (type:namedRange) with specified name and exactness
 * 
 */
function get_nr(name,exact = false) {
  var nr_raw = SpreadsheetApp.getActive().getNamedRanges();
  // Logger.log(nr_raw)
  var nrs = [];
  if(name == undefined){return nr_raw;}
  for(var nr of nr_raw){
    if(exact){if(nr.getName()==name){return nr;}}
    else if(nr.getName().includes(name)){
      nrs.push(nr)
    }
  }
  return nrs
}

function get_full_name(){
  return `${get_prop_value("category",'d')}-${get_prop_value("callname",'d')}`
}
