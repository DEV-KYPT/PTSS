function doc_resize(doc,orientation = "p",size = [595.276,841.89]) {
  //orientation: p: portrait, l: landscape

  //Dictionary of Paper sizes by width and height in o.
  //  letter_size:[612.283,790.866], 
  //  tabloid_size:[790.866,1224.57],
  //  legal_size:[612.283,1009.13],
  //  statement_size:[396.85,612.283],
  //  executive_size:[521.575,756.85],
  //  folio_size:[612.283,935.433],
  //  a3_size:[841.89,1190.55],
  //  a4_size:[595.276,841.89], //default size (A4)
  //  a5_size:[419.528,595.276],
  //  b4_size:[708.661,1000.63],
  //  b5_size:[498.898,708.661]
 
  if(orientation == "p"){doc.getBody().setPageWidth(size[0]).setPageHeight(size[1]);}
  else {doc.getBody().setPageHeight(size[0]).setPageWidth(size[1]);};
};

function doc_set_header_margin(doc,margin = 3) {
  // uses Docs advanced API ("Google Docs API, identifier: [Docs] ")
  const doc_id = doc.getId();  // Please set the document ID.

  const requests = [{
    updateDocumentStyle: {
      documentStyle: {
        marginHeader: {unit: "PT", magnitude: margin},
        marginFooter: {unit: "PT", magnitude: margin}
      },
      fields: "marginHeader,marginFooter"
    }
  }];

  Docs.Documents.batchUpdate({requests: requests}, doc_id);
}

function doc_init(name=get_now(),orientation = "p",header = true,typ = "r"){
  //typ(e): t:template, r:result
  var doc = DocumentApp.create(name);
  var docId = doc.getId()
  if(typ=="t"){DriveApp.getFileById(docId).moveTo(DriveApp.getFolderById(get_prop_value('template-id','d')));}
  else        {DriveApp.getFileById(docId).moveTo(DriveApp.getFolderById(get_prop_value('result-id'  ,'d')));}
  doc_resize(doc,orientation);

  // set basic styles (mainly as Times new roman)
  var style = {}
  style[DocumentApp.Attribute.FONT_FAMILY] = "Times New Roman";
  style[DocumentApp.Attribute.ITALIC]      = false;
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING1,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING2,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING3,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING4,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING5,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.HEADING6,style);
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.SUBTITLE,style);
  // var style = {}
  style[DocumentApp.Attribute.LINE_SPACING] = 0.7;
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.NORMAL,style);

  style[DocumentApp.Attribute.BOLD] = true;
  doc.getBody().setHeadingAttributes(DocumentApp.ParagraphHeading.TITLE,style);

  if(header){ // adds full name as header / time as footer
    doc.addHeader().getParagraphs()[0].appendText(get_full_name());
    doc.addFooter().getParagraphs()[0].setAlignment(DocumentApp.HorizontalAlignment.RIGHT).appendText(get_now());
  }

  doc.setMarginBottom(5);
  doc.setMarginTop(5);
  doc.setMarginLeft(15);
  doc.setMarginRight(15);

  doc_set_header_margin(doc,3)
  
  return doc;
}

function generate_pdf(doc){
  var doc_file = DriveApp.getFileById(doc.getId());
  doc.saveAndClose();

  docblob = doc_file.getAs(MimeType.PDF);

  folder_id = doc_file.getParents().next().getId();
  /* Add the PDF extension */
  docblob.setName(doc.getName() + ".pdf");

  var pdf = DriveApp.createFile(docblob);
  pdf.moveTo(DriveApp.getFolderById(folder_id));
  return pdf;
}

function table_set_style(table,columnWidths,fontSize = 9,style = undefined,centered = false){
  if(style == undefined){ //default style
    style = {};
    style[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.CENTER;
    style[DocumentApp.Attribute.VERTICAL_ALIGNMENT]   = DocumentApp.VerticalAlignment.CENTER;
    style[DocumentApp.Attribute.FONT_SIZE]            = fontSize;
    style[DocumentApp.Attribute.ITALIC]               = false;
    style[DocumentApp.Attribute.BOLD]                 = false;
    style[DocumentApp.Attribute.PADDING_LEFT]         = 3;
    style[DocumentApp.Attribute.PADDING_RIGHT]        = 1;
    style[DocumentApp.Attribute.PADDING_TOP]          = 2;
    style[DocumentApp.Attribute.PADDING_BOTTOM]       = 2;
  }
  
  for(var i = 0; i<table.getNumRows();i++){
    for(var j = 0; j<columnWidths.length;j++){
      // Logger.log("%d,%d (total j: %d)",i,j,v[0].length);
      table.getCell(i,j).setAttributes(style);
      if(i === 0){table.setColumnWidth(j,columnWidths[j])}
    }
  }
  return style
}

function add_st(st,body,typ = "r"){ //add a [St] instance as a neat table to the given document body
  var s_pre_data = `Stage ${st.st_num} \t\tAccepted Problem: ${st.challenge["acc"]} \t\tRejected Problem(s): ${st.challenge["rej"].toString()}`
  var p_pre_data = body.appendParagraph(s_pre_data).setHeading(DocumentApp.ParagraphHeading.NORMAL);

  var a = st.result; //(array of results)
  for(var idx = 1;idx<a.length;idx++){
    a[idx][a[0].length-1] = Math.round(a[idx][a[0].length-1]*100)/100
  }
  a = a.map(row => row.map(e => String(e)));

  var table = body.appendTable(a);
  var col_w = [80,40,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]; //av width: 595.276
  var style_table = table_set_style(table,col_w);

  var s_post_data = '\n'
  if(st.challenge["penalty"]){s_post_data += `Reporting Team Reached ${st.challenge["nrej"]} Rejects. Calculated Reporter Weight is ${st.challenge["weight"]}`}
  var t_post_data = p_pre_data.appendText(s_post_data);
  t_post_data.setFontSize(8).setItalic(true);
  return table
}

function add_summary(rm,body,typ = "r"){ //add a summary of [Rm] instance as a neat table to the given document body
  body.appendParagraph("Results").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  var a_result = [["Team","Score","FW"],['','',''],['','',''],['','',''],['','','']];
  for(var row = 1; row <= 4; row++){
    a_result[row][0] = rm.roster[row-1][1];
    a_result[row][1] = Math.round(rm.summary["scr"][row-1][0]*1000)/1000;
    a_result[row][2] = String(rm.summary["fw"][row-1][0]);
  }
  // Logger.log(a_result)
  var t_result = body.appendTable(a_result);
  var style_result = table_set_style(t_result,[100,35,30]);
  style_result[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.CENTER;
  t_result.setAttributes(style_result);
  return t_result;
}

function gen_rm(pf = 4,rm = 3,doc_in = undefined,out_doc = true,out_pdf = true,typ = "r"){
  // typ(e): r: result, t-c: capture template, t-w: write template
  var doc = null;

  if(doc_in == undefined){
    if(typ=="t_c"){doc =  doc_init(`[CAPTURE TEMPLATE] pf${pf}-rm${rm}`                                ,"p",false,"t");}
    else       {doc =  doc_init(`[${get_full_name()}] pf${pf}-rm${rm} ${get_now()}`);}
  }
  // TODO: do logic for capture/write templates later.

  else{
    doc = doc_in;
    doc.getBody().appendPageBreak();
  }
  var body   = doc.getBody();
  var doc_id = doc.getId();

  var r = new Rm(pf,rm);  // the room instance
  r.pharse(1);

  var p_title = null
  //retrieve paragraph
  if(doc_in = undefined){p_title = doc.getParagraphs()[0];}
  else                  {p_title = doc.appendParagraph('');}
  p_title.appendText("PF Result")
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var s_info = `PF ${r.pf_num}, Room ${r.rm_num} (${r.rm_loc})\nTimekeeper: ${r.tk}, Scorekeeper: ${r.sk}`;
  var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  var s_note = 'Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers.';
  var p_note = body.appendParagraph(s_note).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true).editAsText().setFontSize(8);

  var tb_tables = [];
  for(var stage of r.st.slice(1)){tb_tables.push(add_st(stage,body,typ));}

  var tb_summary = add_summary(r,body,typ);

  var p_confirm = body.appendParagraph("\nThe Preceding Results have Been Checked and Confirmed.").setHeading(DocumentApp.ParagraphHeading.NORMAL).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p_confirm.editAsText().setBold(true).setFontSize(15);

  var s_signature = '';
  s_signature += "\n\nEvaluating Timekeeper\tName   _________________ \tSignature ______________________________________________\n";
  s_signature += "\n\nAdministrative Juror\tName   _________________ \tSignature ______________________________________________\n";
  p_signature = body.appendParagraph(s_signature).setHeading(DocumentApp.ParagraphHeading.NORMAL);
  // footer = 
  // add signature as a footer in case of template. "Confirmation of Chair\tName   _________________ \tSignature _________________________________________"

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

function gen_board(doc_in = undefined,out_doc = true,out_pdf = true,name = undefined,include_confirm = true){
  var b = new Board();
  b.pharse();

  var doc = null;
  if(name == undefined){name = `[${get_full_name()}] scoreboard pf${b.current_pf} ${get_now()}`;}

  if(doc_in == undefined){doc =  doc_init(name);}
  else{
    doc = doc_in;
    doc.appendPageBreak();
  }
  var body = doc.getBody();
  var doc_id=doc.getId();


  var p_title = body.getParagraphs()[0];
  p_title.appendText(`Scoreboard (up to PF${b.current_pf})`)
  p_title.setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var p_note =  body.appendParagraph('Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers');
  p_note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  p_note.editAsText().setFontSize(8);
  p_note.appendText('.').setItalic(false);
  // body.appendParagraph('').setItalic(false);

  var tb = doc.appendTable(b.content_rank.map(row => row.map(e => String(e))));
  var style = table_set_style(tb,[140,40,40,40,40,40,40,70,70,40],12);

  if(include_confirm){
    var p_confirm = body.appendParagraph("The Above Results have Been Checked and Confirmed.");
    p_confirm.setHeading(DocumentApp.ParagraphHeading.NORMAL).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p_confirm.editAsText().setBold(true).setFontSize(12);

    var s_signature  = '';
    s_signature += "\nEvaluator          Name   _________________ \tSignature __________________________________________________\n";
    s_signature += "\nAdministrator    Name   _________________ \tSignature __________________________________________________"
    var p_signature = body.appendParagraph(s_signature);
    p_signature.setHeading(DocumentApp.ParagraphHeading.NORMAL)
  }

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

function gen_pf(pf = 4,out_doc = true,out_pdf = true){
  var doc = gen_board(undefined,true,false,`[${get_full_name()}] pf${pf} ${get_now()}`,true)[0];
  var doc_id = doc.getId();

  var b = new Board();
  var p = new Pf(pf);
  b.pharse();
  p.pharse(0);

  if(pf != b.current_pf){
    Logger.log("Input PF number does not equal current scoreboard!");
    return
  }

  for(var rm_num = 1;rm_num <= p.len_rm;rm_num++){
    doc = gen_rm(pf,rm_num,doc,true,false,'r')[0];
  }

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

function gen_draw(doc_in = undefined,out_doc = true, out_pdf = true,include_confirm = false){
  var doc = null;
  if(name == undefined){name = `[${get_full_name()}] draw_${get_now()}`;}

  if(doc_in == undefined){doc =  doc_init(name);}
  else{
    doc = doc_in;
    doc.appendPageBreak();
  }
  var body = doc.getBody();
  var doc_id=doc.getId();

}

function gen_draw(confirm = false,doc = undefined,docs = true,pdf = true){
  
  var title = body.getParagraphs()[0];
  title.appendText("Tournament Draw");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var note = body.appendParagraph('The order of teams listed (top to bottom) correspond to teams starting as Reporter, Opponent, Reviewer, Observer, Respectively.');
  note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  note.editAsText().setFontSize(8);
  body.appendParagraph('').setItalic(false);  

  // add draw here

  var v = SpreadsheetApp.getActiveSpreadsheet().getRange(`Draw!A3:M24`).getValues();
  var rooms = 6;
  while(v[3][rooms*2] == ''){rooms--;}

  for(var i = 0;i<v.length;i++){
    v[i].splice(rooms*2+1,2*(6-rooms));
  }

  for(var i = 1;i<v[0].length;i=i+2){
    v[0][i+1] = v[0][i];
    v[1][i+1] = v[1][i];
  }

  for(var i = 0;i<v.length;i++){
    for(var j = 0;j<v[0].length;j++){
      if(j%2 == 1){
        v[i][j] = ' ';
      }
      else if(typeof v[i][j] == typeof 1.0){
        v[i][j] = num_to_str(v[i][j]);
      }
    }
  }

  v[0][0] = 'PF';
  v[1][0] = '#';

  var table = body.appendTable(v);

  var mul = 560/(1+ 6 * rooms);

  var columnWidths = [1*mul]; //av width: 595.276
  
  for(var i = 0;i<rooms;i++){
    columnWidths.push(1*mul);
    columnWidths.push(5*mul);
  }

  var style = table_style(table,columnWidths);

  //add drawlist here

  var list_v_raw = SpreadsheetApp.getActive().getRange('Draw!U4:V27').getValues();

  for(var i = 0;i<list_v_raw.length;i++){
    for(var j = 0;j<list_v_raw[0].length;j++){
      if(typeof list_v_raw[i][j] == typeof 1.0){
        list_v_raw[i][j] = num_to_str(list_v_raw[i][j]);
      }
    }
  }

  body.appendParagraph("Draw Placement").setHeading(DocumentApp.ParagraphHeading.NORMAL);

  var list_v = new Array(7).fill('').map(() => new Array(10).fill(''));
  // const matrix = new Array(5).fill(0).map(() => new Array(4).fill(0)); // 5 rows 4 coulumns zero matrix

  [list_v[0][0],list_v[0][1 ]] = ['Draw','Team Name'];
  [list_v[0][3],list_v[0][4 ]] = ['Draw','Team Name'];
  [list_v[0][6],list_v[0][7 ]] = ['Draw','Team Name'];
  [list_v[0][9],list_v[0][10]] = ['Draw','Team Name'];

  // Logger.log(list_v_raw);
  // Logger.log(list_v);

  for(var i = 0;i<6;i++){
    [list_v[i+1][1 ],list_v[i+1][0 ]] = list_v_raw[i];
    [list_v[i+1][4 ],list_v[i+1][3 ]] = list_v_raw[i+6];
    [list_v[i+1][7 ],list_v[i+1][6 ]] = list_v_raw[i+12];
    [list_v[i+1][10],list_v[i+1][9 ]] = list_v_raw[i+18];
  }

  var table_drawlist = body.appendTable(list_v);

  var columnWidths_drawlist = [30,105,1,30,105,1,30,105,1,30,105]; //av width: 595.276

  var style_drawlist = table_style(table_drawlist,columnWidths_drawlist);

  if(confirm){
    var confirmQuote = body.appendParagraph("The Above Results have Been Checked and Confirmed.").setHeading(DocumentApp.ParagraphHeading.NORMAL).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    confirmQuote.editAsText().setBold(true).setFontSize(15);
    
    signatureOpening = body.appendParagraph(
      "\n\nTimekeeper 1     Name   _________________ \tSignature __________________________________________________\n"+
      "\n\nTimekeeper 2     Name   _________________ \tSignature __________________________________________________\n"+
      "\n\nAdministrator     Name   _________________ \tSignature __________________________________________________"
    )
    signatureOpening.setHeading(DocumentApp.ParagraphHeading.NORMAL)
  }  

  if(pdf){
    var pdf = savePDF(doc);
    if (! docs){ return pdf;}
    else {return [DocumentApp.openById(docId),pdf];}
  }
  else{
    return doc;
  }
}