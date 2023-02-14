function refresh_calc(ss = get_ss_spreadsheet(),sheet_calc = ss.getSheetByName("CALC")){
  halt_calc();
  Utilities.sleep(100);
  resume_calc();
}

function halt_calc(ss = get_ss_spreadsheet()){
  for(var p = 1; p <= 6; p++){ss.getRange(`CALC_P${p}`).setValue("");}
}

function resume_calc(ss = get_ss_spreadsheet()){
  for(var p = 1; p <= 6; p++){ss.getRange(`CALC_P${p}`).setValue(`P${p}`);}  
}

function is_spawned(ss = get_ss_spreadsheet(),sheet_data = ss.getSheetByName("DATA")){
  var unit = ss.getRange("DATA_P1R1_FULL");
  var unit_rows = unit.getNumRows();
  var unit_cols = unit.getNumColumns();

  return(sheet_data.getMaxColumns() >= unit_cols + 3 || sheet_data.getMaxRows() >= unit_rows+3)
}

function spawn(ss = get_ss_spreadsheet(),sheet_data = null, pfs = null, rms = null) {
  // retrieve relevant sizes  
  // the "unit" is the named range DATA_P1R1_*

  var ms_start = get_milisec();
  Logger.log(`[SPAWN] Spawn Started.`)
  var ms = ms_start;

  if(sheet_data == null){sheet_data = ss.getSheetByName("DATA");}
  if(pfs == null){pfs = ss.getRange("SEED_PFS").getValue();}
  if(rms == null){rms = ss.getRange("SEED_RMS").getValue();}
  var unit_prefix = "DATA_P1R1_"


  // input condition check
  if(is_spawned()){Logger.log("[SPAWN] Illegal Spawn Detected.");return}
  halt_calc();

  var unit = ss.getRange(unit_prefix+"FULL");
  // var sheet_data = unit.getSheet();
  var unit_rows  = unit.getNumRows();
  var unit_cols  = unit.getNumColumns();

  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Spawining DATA with: PFs: [${pfs}] / RMs:[${rms}]`)
  ms = get_milisec();

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

  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Specs Gathered`)
  ms = get_milisec();
  // add columns
  sheet_data.insertColumnsAfter(sheet_data.getLastColumn(),unit_cols*(pfs-1));

  // paste column widths
  for (let [prefix, origin] of Object.entries(origins)) {
    if(prefix.includes("R1_")){unit.copyTo(sheet_data.getRange(origin[0],origin[1]),SpreadsheetApp.CopyPasteType.PASTE_COLUMN_WIDTHS,false);}
  }

  // add rows
  sheet_data.insertRowsAfter(sheet_data.getLastRow(),unit_rows*(rms-1));

  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Rows/Columns Expanded`);
  ms = get_milisec()

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
  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Designations Set`);
  ms = get_milisec()

  var cf_rules = sheet_data.getConditionalFormatRules();

  var s_rm_origin_row = `ROW()-MOD((ROW()-2),${unit_rows})`;
  var s_rm_origin_col = `COLUMN()-MOD((COLUMN()-2),${unit_cols})`;

  cf_rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setRanges([ss.getRange('DATA_P1R1_S4')])
    .whenFormulaSatisfied(`=INDIRECT(ADDRESS(${s_rm_origin_row}+1,${s_rm_origin_col}+2))=3`)
    .setBackground('#000000')
    .setFontColor('#000000')
    .build()
  );

  sheet_data.setConditionalFormatRules(cf_rules);

  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Conditional Formatting Set`);
  ms = get_milisec();

  // tournament/pf-scale named ranges
  var range_full = sheet_data.getRange(origin_row,origin_col,unit_rows*rms,unit_cols*pfs);
  ss.setNamedRange("DATA_FULL",range_full);

  var range_pf = null;
  for(var idx_pf = 1;idx_pf <= pfs;idx_pf++){
    range_pf = sheet_data.getRange(origin_row,origin_col+unit_cols*(idx_pf-1),unit_rows*rms,unit_cols);
    ss.setNamedRange(`DATA_P${idx_pf}_FULL`,range_pf);
  }

  // copy&paste format and content + add named ranges based on unit_nrs_specs
  for(let [prefix,origin] of Object.entries(origins)){
    // copy named ranges
    for(let [name,spec] of Object.entries(unit_nrs_specs)){
      var full_name = prefix+name
      var range     = sheet_data.getRange(origin[0]+spec[0],origin[1]+spec[1],spec[2],spec[3])
      // Logger.log(full_name);
      // Logger.log([origin[0]+spec[0],origin[1]+spec[1],spec[2],spec[3]])
      ss.setNamedRange(full_name,range);
    }

    var copy_origin = sheet_data.getRange(origin[0],origin[1])
    // copy the contents
    unit.copyTo(copy_origin, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    unit.copyTo(copy_origin, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

  }
  Logger.log(`[SPAWN][+${get_milisec()-ms}ms] Contents / Named Ranges Copied`)
  // ms = get_milisec();

  Logger.log(`[SPAWN] Total Elapsed Time: ${get_milisec()- ms_start}ms`)

  // resume_calc(); // manually done through ui
}

function unspawn(ss = get_ss_spreadsheet(),sheet_data = ss.getSheetByName("DATA")){
  // var ss  = get_ss_spreadsheet();
  var unit_prefix = "DATA_P1R1_"
  var unit = ss.getRange(unit_prefix+"FULL");
  // var sheet_data = unit.getSheet();
  var unit_rows  = unit.getNumRows();
  var unit_cols  = unit.getNumColumns();
  var origin_row = unit.getRow();
  var origin_col = unit.getColumn();

  if(!is_spawned()){Logger.log("[UNSPAWN] Illegal Unspawn Detected.");return;}

  // remove conditional formatting
  sheet_data.setConditionalFormatRules([]);

  // delete named ranges
  var nr_data = get_nr("DATA_P");
  nr_data = nr_data.concat(get_nr("DATA_FULL"));
  for(var nr of nr_data){
    if(!(nr.getName().includes(unit_prefix) || nr.getName().includes("EX_"))){
      // Logger.log(nr.getName());
      nr.remove();
    }
  }

  Logger.log("[UNSPAWN] NRs Removed")

  // delete columns / Rows
  sheet_data.deleteColumns(origin_col+unit_cols, sheet_data.getLastColumn() - (origin_col+unit_cols)+1);
  sheet_data.deleteRows   (origin_row+unit_rows, sheet_data.getLastRow()    - (origin_row+unit_rows)+1);
  Logger.log("[UNSPAWN] Contents Removed")

}

function respawn(){
  unspawn();
  Logger.log("[RESPAWN] Unspawn Complete");
  spawn();
  Logger.log("[RESPAWN] Respawn Complete.")
}
