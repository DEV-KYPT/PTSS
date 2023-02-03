function refresh_calc(ss = get_ss_spreadsheet(),sheet_calc = ss.getSheetByName("CALC")){
  for(var p = 1; p <= 6; p++){ss.getRange(`CALC_P${p}`).setValue("");}
  Utilities.sleep(100);
  for(var p = 1; p <= 6; p++){ss.getRange(`CALC_P${p}`).setValue(`P${p}`);}  
}

function populate_data(ss = get_ss_spreadsheet(),sheet_data = ss.getSheetByName("DATA"),pfs = get_ss_spreadsheet().getRange("SEED_PFS").getValue(), rms = get_ss_spreadsheet().getRange("SEED_RMS").getValue()) {
  // retrieve relevant sizes  
  // the "unit" is the named range DATA_P1R1_*
  var unit_prefix = "DATA_P1R1_"

  var unit = ss.getRange(unit_prefix+"FULL");
  // var sheet_data = unit.getSheet();
  var unit_rows  = unit.getNumRows();
  var unit_cols  = unit.getNumColumns();

  // input condition check
  if(sheet_data.getMaxColumns() >= unit_cols+3 || sheet_data.getMaxRows() >= unit_rows+3){
    Logger.log("Illegal Populate Detected.")
    return
  }

  Logger.log(`Populating DATA with: PFs: [${pfs}] / RMs:[${rms}]`)

  // retrieve relevant named ranges / their specs
  var unit_nrs = get_nr(unit_prefix);
  var unit_nrs_specs = {};
  var origin_row = unit.getRow();
  var origin_col = unit.getColumn();
  
  var range
  var name 

  for(var nr of unit_nrs){
    range = nr.getRange();
    name  = nr.getName();
    //spec prototype: {name(without prefix): [origin row offset,origin col offset,number of rows, number of colomns]}
    unit_nrs_specs[name.slice(unit_prefix.length)] = [range.getRow() - origin_row,range.getColumn() - origin_col,range.getNumRows(),range.getNumColumns()]
  }
  // Logger.log(unit_nrs_specs)
  //calculate origins with their prefixes
  var origins = {}
  for(var pf = 1; pf <= pfs ; pf++){
    for(var rm = 1; rm <= rms ; rm++){
      if(pf == 1 && rm == 1){continue;}
      origins[`DATA_P${pf}R${rm}_`]=[origin_row+unit_rows*(rm-1),origin_col+unit_cols*(pf-1)]
    }
  }
  // Logger.log(origins)

  Logger.log("[GEN-POPULATE] Specs Gathered")
  // add columns
  sheet_data.insertColumnsAfter(sheet_data.getLastColumn(),unit_cols*(pfs-1));

  // paste column widths
  for (let [prefix, origin] of Object.entries(origins)) {
    if(prefix.includes("R1_")){unit.copyTo(sheet_data.getRange(origin[0],origin[1]),SpreadsheetApp.CopyPasteType.PASTE_COLUMN_WIDTHS,false);}
  }

  // merge and type appropriate PF numbers
  var current_col = origin_col+unit_cols;
  var current_pf  = 2;
  while(current_col < sheet_data.getMaxColumns()){
    var merge_range = sheet_data.getRange(1,current_col,1,unit_cols)
    merge_range
      .merge()
      .setValue(`PF${current_pf}`)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontFamily('Ubuntu Mono')
      .setFontSize(24)
      .setFontWeight('bold');
    current_col += unit_cols;
    current_pf += 1;
  }


  // add rows
  sheet_data.insertRowsAfter(sheet_data.getLastRow(),unit_rows*(rms-1));
  
  // merge and type appropriate RM numbers
  var current_row = origin_row+unit_rows;
  var current_rm  = 2;
  while(current_row < sheet_data.getMaxRows()){
    var merge_range = sheet_data.getRange(current_row,1,unit_rows,1)
    merge_range
      .merge()
      .setValue(`RM${current_rm}`)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontFamily('Ubuntu Mono')
      .setFontSize(24)
      .setFontWeight('bold')
      .setTextRotation(90);
    current_row += unit_rows;
    current_rm += 1
  }
  Logger.log("[GEN-POPULATE] Designations Set")

  // copy&paste format and content + add named ranges based on unit_nrs_specs
  for(let [prefix,origin] of Object.entries(origins)){
    var copy_origin = sheet_data.getRange(origin[0],origin[1])
    // copy the contents
    unit.copyTo(copy_origin, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    unit.copyTo(copy_origin, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

    // copy named ranges
    for(let [name,spec] of Object.entries(unit_nrs_specs)){
      var full_name = prefix+name
      var range     = sheet_data.getRange(origin[0]+spec[0],origin[1]+spec[1],spec[2],spec[3])
      // Logger.log(full_name);
      // Logger.log([origin[0]+spec[0],origin[1]+spec[1],spec[2],spec[3]])
      ss.setNamedRange(full_name,range);
    }
  }
  Logger.log("[GEN-POPULATE] Contents / Named Ranges Copied")


  // Set Conditional Formatting
  var cf_rules = sheet_data.getConditionalFormatRules();
  var cf_nrs = get_nr("_S4");
  var cf_ranges = []
  for(var nr of cf_nrs){
    cf_ranges.push(nr.getRange());
    // Logger.log(nr.getName());
  }

  cf_rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges(cf_ranges)
    .whenFormulaSatisfied(`=INDIRECT(ADDRESS(ROW()-MOD((ROW()-2),${unit_rows})+2,COLUMN()-MOD((COLUMN()-2),${unit_cols})+2))=3`)
    .setBackground('#000000')
    .setFontColor('#000000')
    .build()
  );

  sheet_data.setConditionalFormatRules(cf_rules);

  Logger.log("[GEN-POPULATE] Conditoinal Formatting Set")

}

function unpopulate_data(ss = get_ss_spreadsheet(),sheet_data = ss.getSheetByName("DATA")){
  // var ss  = get_ss_spreadsheet();
  var unit_prefix = "DATA_P1R1_"
  var unit = ss.getRange(unit_prefix+"FULL");
  // var sheet_data = unit.getSheet();
  var unit_rows  = unit.getNumRows();
  var unit_cols  = unit.getNumColumns();
  var origin_row = unit.getRow();
  var origin_col = unit.getColumn();

  if(sheet_data.getMaxColumns() <= unit_cols+3 || sheet_data.getMaxRows() <= unit_rows+3){
    Logger.log("Illegal Unpopulate Detected.")
    return
  }

  // remove conditional formatting
  sheet_data.setConditionalFormatRules([]);

  // delete named ranges
  var nr_data = get_nr("DATA_P")
  for(var nr of nr_data){
    if(!(nr.getName().includes(unit_prefix))){
      // Logger.log(nr.getName());
      nr.remove();
    }
  }

  Logger.log("[GEN-UNPOPULATE] NRs Removed")

  // delete columns / Rows
  sheet_data.deleteColumns(origin_col+unit_cols, sheet_data.getLastColumn() - (origin_col+unit_cols)+1);
  sheet_data.deleteRows   (origin_row+unit_rows, sheet_data.getLastRow()    - (origin_row+unit_rows)+1);
  Logger.log("[GEN-UNPOPULATE] Contents Removed")

}

function repopulate_data(){
  unpopulate_data();
  Logger.log("[GEN-REPOPULATE] Unpopulate Complete");
  populate_data();
  Logger.log("[GEN-REPOPULATE] Populate Complete.")
}
