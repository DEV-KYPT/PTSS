function slice_2d(array=[[]],idx_s = [0,0],idx_e = [array.length,array[0].length]){
  return array.slice(idx_s[0],idx_e[0]+1).map(row => row.slice(idx_s[1],idx_e[1]+1))
}

function string_2d(array=[[null]],name='',pre_tabs = 0,output_dims = false,max_size = 0){
  var maxlen = 0;
  for(var row of array){for(var entry of row){if(entry.toString().length > maxlen){maxlen = entry.toString().length;}}}

  var line_len = (maxlen+1)*array[0].length-1
  if(max_size > 0 && maxlen > max_size){line_len = (max_size+1)*array[0].length-1}
  // Logger.log(line_len)

  var output = '';

  var label = name;
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

function multistring_2d(arrays = [[[]],[[]]],names = undefined,pre_tabs = 0,output_dims = false,max_size = 0,delim = ` | `){
  var lines_raw = []
  if(names == undefined){names = Array(arrays.length).fill('')}

  for(var idx = 0;idx< arrays.length;idx++){lines_raw.push(string_2d(arrays[idx],names[idx],0,output_dims,max_size).split("\n"))}
  // Logger.log(string_2d(lines_raw))
  var max_lines = 0;
  for(var l of lines_raw){if(l.length > max_lines){max_lines = l.length;}}

  // Logger.log(lines_raw[0].length)

  for(var l = 0;l < lines_raw.length;l++){
    // Logger.log(l)
    if(lines_raw[l].length < max_lines){
      // Logger.log(`resizing entry ${l}`)
      lines_raw[l].push(Array(max_lines-lines_raw[l].length).fill(' '.repeat(lines_raw[l][0].length)));
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