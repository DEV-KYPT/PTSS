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
