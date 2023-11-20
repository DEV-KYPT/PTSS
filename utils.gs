// general utilities

// utility for use in spreadsheet

/**
 *
 * @param {number} row - The row number of the cell reference. Row 1 is row number 0.
 * @param {number} column - The column number of the cell reference. A is column number 0.
 * @returns {string} Returns a cell reference as a string using A1 Notation
 *
 * @example
 *
 *   getA1Notation(2, 4) returns "E3"
 *   getA1Notation(2, 4) returns "E3"
 *
 */
function get_a1(row, column){
  const a1Notation = [`${row}`];
  const totalAlphabets = 'Z'.charCodeAt() - 'A'.charCodeAt() + 1;
  let block = column-1;
  while (block >= 0) {
    a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt()));
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return a1Notation.join('');
};

function get_a1_notation(row,column,numr = 1,numc = 1,sheet_name = null){
  if(numr == 1 && numc == 1){return get_a1(row,column)}
  var not1 = get_a1(row,column);
  var not2 = get_a1(row+numr-1,column+numc-1);
  if(sheet_name != null){return String(`'${sheet_name}'${not1}:${not2}`);}
  return String(`${not1}:${not2}`);
}

function make_relative(range = SpreadsheetApp.getActiveRange(),do_edit = true,do_log = true){
  var f_start = get_content(range);
  var count = 0
  var f_edited = create_2d([f_start.length,f_start[0].length],"");
  for(var idx_row = 1;idx_row <= range.getNumRows();idx_row++){
    for(var idx_col = 1;idx_col <= range.getNumColumns();idx_col++){
      if(f_start[idx_row-1][idx_col-1] == ""){continue;}
      else if(f_start[idx_row-1][idx_col-1].includes("$")){
        f_edited[idx_row-1][idx_col-1] = f_start[idx_row-1][idx_col-1].replaceAll("$","");
        count += 1;
      }
      else{
        f_edited[idx_row-1][idx_col-1] = f_start[idx_row-1][idx_col-1];
      }
    }
  }
  if(do_edit){range.setFormulas(f_edited);}
  if(do_log) {Logger.log(`${count} Formulas edited.`);}
  return f_edited;
}

function get_content(range){ //returns a formula string if contents are a formula, returns value if contents are a value.
  var values   = range.getValues();
  var formulas = range.getFormulas();
  for(var i = 0;i<formulas.length;i++){
    for(var j = 0;j<formulas[0].length;j++){
      if(formulas[i][j] == ""){
        formulas[i][j] = String(values[i][j]);
      }
    }
  }
  return formulas
}

function range_spec(range = SpreadsheetApp.getActiveRange()){
  var readout = "[Range Specifications]";
  var sheet = range.getSheet();
  readout += `\n${sheet.getName()}:${range.getA1Notation()}`;
  readout += `\nlocation: Row ${range.getRow()}, Column ${range.getColumn()}`;
  readout += `\nsize: ${range.getNumRows()} rows, ${range.getNumColumns()} columns`;

  Logger.log(readout);
  return readout;
}

function speedometer(){
  var ss = get_ss_spreadsheet();
  var time_sheet = [];
  var readout = "Speedometer Readings"

  /////////////////////////////////////////////////////
  var ms = get_milisec();
  
  var a = ss.getRange("DATA_P1_FULL");
  
  readout += `\n[SPEED] getRange : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////
  ms = get_milisec();

  var v = a.getValues();
  readout += `\n[SPEED] getValues : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////
  // ms = get_milisec();

  // var t = new Tournament();
  // t.parse(5);
  // Logger.log(t.pf[2].rm[4].st[3].interpret());
  // readout += `\n[SPEED] Tournament parse Level 5 : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////
  ms = get_milisec();

  var t = new Tournament;
  t.parse(5);

  var sheet_data = ss.getSheetByName("DATA");
  var uin = t.get_uin();
  Logger.log(uin);
  var uin_rl = sheet_data.getRangeList(uin);
  uin_rl.activate();
  var uin_ranges = uin_rl.getRanges();
  Logger.log(uin_ranges.length)
  readout += `\n[SPEED] Tournament parse Level 5 / uin recovery : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////
  // ms = get_milisec();

  // var fin = new Finrm();
  // fin.parse(2);
  // Logger.log(fin.interpret(2))
  // readout += `\n[SPEED] Final Parse : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////
  // ms = get_milisec();

  // var v = a.getValues();
  // readout += `\n[SPEED] getValues : ${get_milisec()-ms}ms`

  /////////////////////////////////////////////////////

  Logger.log(readout);
  return readout
}

/**
 * [global] 2d Array handling function (slicing) (0-indexed) (end-inclusive)
 * @param {array} array - The 2D array to slice
 * @param {array} idx_s - The "top left coordinates" of the slice (default: [0,0]).
 * @param {array} idx_e - The "bottom right coordinates" of ths slice (*INCLUSIVE) (default: [array.length-1,array[0].length-1]).
 * @returns {array} the sliced 2D array
 *
 * @example
 *
 *    slice_2d([[a,b,c],[d,e,f],[g,h,i]],[1,1],[2,2]) returns [[e,f],[h,i]]
 *    slice_2d([[a,b,c],[d,e,f],[g,h,i]],undefined,[1,2]) returns [[a,b,c],[d,e,f]]
 *
 */
function slice_2d(array=[[]],idx_s = [0,0],idx_e = [array.length-1,array[0].length-1]){
  return array.slice(idx_s[0],idx_e[0]+1).map(row => row.slice(idx_s[1],idx_e[1]+1))
}

function clear_2d(array=[[]],idx_s = [0,0],idx_e = [array.length-1,array[0].length-1]){
  for(var idx_row = idx_s[0];idx_row <= idx_e[0];idx_row++){
    for(var idx_col = idx_s[1];idx_col <= idx_e[1];idx_col++){
      array[idx_row][idx_col] = "";
    }
  }
  return array
}

function attatch_2d(arrays=[[['1']],[['a','b','c'],['d','e','f']],[[]]],fill_char = ""){
  var max_rows = 0;
  for(var arr of arrays){
    if(arr.length > max_rows){max_rows = arr.length;}
  }
  // Logger.log(max_rows)
  var resized_arrays = [];
  for(var arr of arrays){resized_arrays.push(resize_2d(arr,[max_rows,null],fill_char));}
  // Logger.log(resized_arrays)
  var output_array = [];
  for(var idx_row = 0;idx_row<max_rows;idx_row++){
    output_array.push([]);
    for(var arr of resized_arrays){
      output_array[idx_row] = output_array[idx_row].concat(arr[idx_row]);
    }
  }
  return output_array
}

function resize_2d(array = [[]],size = [null,null],fill_char = ""){
  var row = size[0];
  var col = size[1];
  if(size[0] == null){row = array.length;}
  if(size[1] == null){col = array[0].length;}
  if(row > array.length){array = array.concat(Array(row-array.length).fill([]));}
  else if(row< array.length){array = array.slice(0,row)}
  for(var idx_row = 0;idx_row<row;idx_row++ ){
    // Logger.log(array[idx_row])
    if(col > array[idx_row].length){array[idx_row] = array[idx_row].concat(Array(col-array[idx_row].length).fill(fill_char));}
    else if (col < array[idx_row].length){array[idx_row] = array[idx_row].slice(0,col);}
  }
  return array
}

function copy_2d(array){
  var new_array = [];
  for(var i_r = 0;i_r < array.length;i_r++){
    new_array[i_r] = array[i_r].slice();
    // Logger.log(array[i_r].slice())
  }
  // Logger.log(`origin: ${string_2d(array)}`)
  // Logger.log(`copied: ${string_2d(new_array)}`)
  return new_array
}

function create_2d(size = [2,2],value = ""){
  var arr = [];
  for(var i = 0;i<size[0];i++){
    var row = [];
    for(var j = 0;j<size[1];j++){
      row.push(value);
    }
    arr.push(row);
  }
  return arr
}

// 2d array visualization

function string_2d(array=[[null]],name='',pre_tabs = 0,output_dims = false,max_size = 0){
  var maxlen = 0;
  for(var row of array){for(var entry of row){if(entry.toString().length > maxlen){maxlen = entry.toString().length;}}}

  var line_len = (maxlen+1)*array[0].length-1
  if(max_size > 0 && maxlen > max_size){line_len = (max_size+1)*array[0].length-1}
  // Logger.log(line_len)

  var output = '';

  var label = String(name);
  if(output_dims){label += `[${array.length}][${array[0].length}]`;}
  if(name != '' || (output_dims)){
    if(line_len >= label.length){output += `${'\t'.repeat(pre_tabs)}${label}${' '.repeat(line_len-label.length)}\n`}
    else                        {output += `${'\t'.repeat(pre_tabs)}${label.slice(0,line_len)}\n`}
  }
  var line = ''
  var temp = ''
  for(var row of array){
    output += `${'\t'.repeat(pre_tabs)}`
    // output += '['
    line = ''
    for(var entry of row){
      temp = `${entry.toString()}${' '.repeat(maxlen-entry.toString().length)}`
      if(temp.length>max_size && max_size > 0){temp = temp.slice(0,max_size)}
      line += temp+',';
    }
    output += line.slice(0,line.length-1); //cut out last ","
    output += '\n'
    // output += '],'
  }
  // output += '\n]'

  return output.slice(0,output.length-1); //cut out last "\n"
}

function multistring_2d(arrays = [[[]],[[]]],names = null,pre_tabs = 0,output_dims = false,max_size = 0,delim = ` | `){
  var lines_raw = []
  if(names == null){names = Array(arrays.length).fill('')}

  for(var idx = 0;idx< arrays.length;idx++){lines_raw.push(string_2d(arrays[idx],names[idx],0,output_dims,max_size).split("\n"))}
  // Logger.log(string_2d(lines_raw))
  var max_lines = 0;
  for(var l of lines_raw){if(l.length > max_lines){max_lines = l.length;}}

  // Logger.log(lines_raw[0].length)

  for(var l = 0;l < lines_raw.length;l++){
    // Logger.log(l)
    if(lines_raw[l].length < max_lines){
      // Logger.log(`resizing entry ${l}`)
      lines_raw[l]= lines_raw[l].concat(Array(max_lines-lines_raw[l].length).fill(' '.repeat(lines_raw[l][0].length)));
    }
  }

  // Logger.log(string_2d(lines_raw))
  // Logger.log(delim)

  output = ''
  for(var line = 0;line<max_lines;line++){
    output += `${'\t'.repeat(pre_tabs)}${delim}`;
    for(var idx = 0;idx<lines_raw.length;idx++){
      output += `${lines_raw[idx][line]}${delim}`;
    }
    output += "\n"
  }

  return output
}

// chatbot utilities

function simplify_name(s){
  return s.slice(0,2)+s.slice(-1);
}

function filter_empty(arr){
  return arr.filter(element => {return element !== '';});
}

function remove_item(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

// html utils (for chatbot)
function str_to_html(s){
  return s.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

function get_cb_style(typ){
  var cb_styles = { // chatbot colors
  "default"  : ["black"        ,'normal' ],
  "cmd"      : ["darkmagenta"  ,'bold'   ], //command
  "error"    : ["red"          ,'normal' ],
  "warn"     : ["orange"       ,'normal' ],
  "challenge": ["blue"         ,'bold'   ], //challenge
  "reject"   : ["darkred"      ,'bold'], //rejected
  "accept"   : ["forestgreen"  ,'bold'   ], //accepted
  "relaxed"  : ["deeppink"     ,'normal' ], //relaxed
  "conflict" : ["maroon"       ,'normal' ], //conflicting rules
  "undo"     : ["brown"        ,'normal' ],  //undo(tooltip)
  "status"   : ["purple"       ,'bold'   ],
  "write"    : ["darkslateblue",'normal' ],
  "cache"    : ["gray"         ,'normal' ]
  }
  return cb_styles[typ];
}

function html(s,style = "default",tag = 'span'){
  if([null,null,''].includes(style)){
    return str_to_html(`<${tag}>${s}</${tag}>`);
  }
  var st = get_cb_style(style);
  return str_to_html(`<${tag} style="color:${st[0]};font-weight:${st[1]};">${s}</${tag}>`);
}

function html_table(array,styles = null,header = true,){
  if(styles == null){styles = create_2d([array.length,array[0].length],'default');}
  // Logger.log(string_2d(styles))
  var output_html = "<table>";
  var data = copy_2d(array);
  if(header){
    output_html+="<tr>"
    for(var j = 0;j<data[0].length;j++){output_html+=html(data[0][j],styles[0][j],'th')}
    output_html+="</tr>"
    data.splice(0,1);
    styles.splice(0,1);
  }
  for(var i = 0;i<data.length;i++){
    output_html+=`<tr>`
    for(var j = 0;j<data[0].length;j++){output_html+=html(data[i][j],styles[i][j],'td')}
    output_html+=`</tr>`
  }
  output_html+="</table>"
  return str_to_html(output_html);
}





















