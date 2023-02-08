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

function table_set_style(table,columnWidths,fontSize = 9,style = undefined,centered = false,padding = [3,1,2,2]){
  if(style == undefined){ //default style
    style = {};
    style[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.CENTER;
    style[DocumentApp.Attribute.VERTICAL_ALIGNMENT]   = DocumentApp.VerticalAlignment.CENTER;
    style[DocumentApp.Attribute.FONT_SIZE]            = fontSize;
    style[DocumentApp.Attribute.ITALIC]               = false;
    style[DocumentApp.Attribute.BOLD]                 = false;
    style[DocumentApp.Attribute.PADDING_LEFT]         = padding[0];
    style[DocumentApp.Attribute.PADDING_RIGHT]        = padding[1];
    style[DocumentApp.Attribute.PADDING_TOP]          = padding[2];
    style[DocumentApp.Attribute.PADDING_BOTTOM]       = padding[3];
  }
  if(centered){style[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT]=DocumentApp.HorizontalAlignment.CENTER;} //doesn't work...

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

function add_confirm(body,entities = ["Administrator"],orientation = "p",spacing = 1){

  var p_confirm = body.appendParagraph("The Above Results have Been Checked and Confirmed.");
  p_confirm.setHeading(DocumentApp.ParagraphHeading.NORMAL).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p_confirm.editAsText().setBold(true).setFontSize(12);

  var s_signature  = '';
  for(var e of entities){
    s_signature += `${"\n".repeat(spacing)}${e}${" ".repeat(25-e.length)}`
    s_signature += `Name   _________________ \tSignature ____________________________`;
  }
  var p_signature = body.appendParagraph(s_signature);
  p_signature.setHeading(DocumentApp.ParagraphHeading.NORMAL).setFontFamily("Ubuntu Mono");
  // p_signature.setFontWeight('bold');
  return body;
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

  add_confirm(body,['Evaluating Timekeeper','Administrative Juror'],'p',2);

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

function gen_rm_wt(pf = 4,rm = 3,doc_in = undefined,out_doc = true,out_pdf = true){
  var doc = null;

  if(doc_in == undefined){doc =  doc_init(`[WRITE TEMPLATE] pf${pf}-rm${rm} ${get_now()}`);}

  else{
    doc = doc_in;
    doc.getBody().appendPageBreak();
  }
  var body   = doc.getBody();
  var doc_id = doc.getId();

  

}

// function gen_rm(pf = 4,rm = 3,doc_in = undefined,out_doc = true,out_pdf = true,typ = "r"){
//   // typ(e): r: result, t-c: capture template, t-w: write template
//   var doc = null;

//   if(doc_in == undefined){
//     if(typ=="t_c"){doc =  doc_init(`[CAPTURE TEMPLATE] pf${pf}-rm${rm}`                                ,"p",false,"t");}
//     else       {doc =  doc_init(`[${get_full_name()}] pf${pf}-rm${rm} ${get_now()}`);}
//   }
//   // TODO: do logic for capture/write templates later.

//   else{
//     doc = doc_in;
//     doc.getBody().appendPageBreak();
//   }
//   var body   = doc.getBody();
//   var doc_id = doc.getId();

//   var r = new Rm(pf,rm);  // the room instance
//   r.pharse(1);

//   var p_title = null
//   //retrieve paragraph
//   if(doc_in = undefined){p_title = doc.getParagraphs()[0];}
//   else                  {p_title = doc.appendParagraph('');}
//   p_title.appendText("PF Result")
//   p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

//   var s_info = `PF ${r.pf_num}, Room ${r.rm_num} (${r.rm_loc})\nTimekeeper: ${r.tk}, Scorekeeper: ${r.sk}`;
//   var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

//   var s_note = 'Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers.';
//   var p_note = body.appendParagraph(s_note).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true).editAsText().setFontSize(8);

//   var tb_tables = [];
//   for(var stage of r.st.slice(1)){tb_tables.push(add_st(stage,body,typ));}

//   var tb_summary = add_summary(r,body,typ);

//   add_confirm(body,['Evaluating Timekeeper','Administrative Juror'],'p',2);

//   var pdf = null;
//   if(out_pdf){
//     pdf = generate_pdf(doc);
//     doc = DocumentApp.openById(doc_id);
//   }
//   return [doc,pdf]
// }

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

  if(include_confirm){add_confirm(body,['Evaluator','Administrator'],'p',1);}

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

function gen_draw(doc_in = undefined,out_doc = true, out_pdf = true,include_confirm = true){
  var doc = null;
  var name = `[${get_full_name()}] draw ${get_now()}`;

  if(doc_in == undefined){doc =  doc_init(name);}
  else{
    doc = doc_in;
    doc.appendPageBreak();
  }
  var body = doc.getBody();
  var doc_id=doc.getId();

  var t = new Tournament();
  t.pharse(0);

  var p_title = body.getParagraphs()[0];
  p_title.appendText("Tournament Draw");
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var p_note = body.appendParagraph('The order of teams listed (top to bottom) correspond to teams starting as Reporter, Opponent, Reviewer, Observer, Respectively.');
  p_note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  p_note.editAsText().setFontSize(8);
  body.appendParagraph('').setItalic(false);

  var a_draw = t.draw.draw_full;

  for(var i = 1;i < a_draw[0].length;i += 2){a_draw = clear_2d(a_draw,[0,i],[a_draw.length-1,i]);}
  // Logger.log(string_2d(a_draw))
  
  var t_draw = body.appendTable(a_draw);
  var cwf_draw = 560/(2+5.5*t.len_rm); //av width: 595.276 //cwf: column width factor
  var cw_draw = [2*cwf_draw];
  for(var i = 0;i<t.len_rm;i++){cw_draw = cw_draw.concat([0.5*cwf_draw,5*cwf_draw]);}

  var st_draw = table_set_style(t_draw,cw_draw,9,undefined,true,[2,1,1,1]);

  // roster
  var a_roster = t.draw.draw_roster.map(row => row.map(e => String(e)));
  var col_len = 12; //number of teams to include in one col.
  var a_roster_cut = [];
  for(var i = 0;i<=t.draw.num_teams;i += col_len){
    var j = i + col_len;
    if(j > t.draw.num_teams){j = t.draw.num_teams};
    // Logger.log([i,j,t.draw.num_teams])
    a_roster_cut.push(a_roster.slice(i,j));
    a_roster_cut.push([[" "]]);//empty column for spacing
  }
  
  var a_header = [["Draw","Team Name"]];
  for(var col = 0;col<a_roster_cut.length;col+=2){a_roster_cut[col] = a_header.concat(a_roster_cut[col]);}
  // Logger.log(multistring_2d(a_roster_cut))
  var a_roster_processed = attatch_2d(a_roster_cut);
  // Logger.log(string_2d(a_roster_processed,undefined,0,true))

  body.appendParagraph("Draw Placement").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  var t_roster_cut = body.appendTable(a_roster_processed);
  var cwf_roster = 560/(6.5*(a_roster_cut.length/2));
  var cw_roster = [];
  for(var i = 0;i<a_roster_cut.length/2;i++){cw_roster = cw_roster.concat([1.5*cwf_roster,4.5*cwf_roster,0.5*cwf_roster]);}
  // Logger.log(cw_roster)

  var st_roster = table_set_style(t_roster_cut,cw_roster,9,undefined,true,[2,1,1,1]);

  if(include_confirm){add_confirm(body,['Administrator'],'p',2);}

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

function gen_db(doc_in = undefined,out_doc = true,out_pdf = true,include_confirm = false){
  var doc = null;
  var name = `[${get_full_name()}] database ${get_now()}`;

  if(doc_in == undefined){doc =  doc_init(name,'l');}
  else{
    doc = doc_in;
    doc.appendPageBreak();
  }
  var body = doc.getBody();
  var doc_id=doc.getId();

  var c = new Core();
  c.pharse();

  var p_title = doc.getParagraphs()[0];
  p_title.appendText(`Tournament Progression Information (${get_now()})`);
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var a_prbs  = slice_2d(attatch_2d([c.content_teams,c.content_prbs ]).map(row => row.map(e => String(e))),[2,0]);
  var a_prbs_header = [['','Reported (P)','Opposed (O)','Reviewed (R)','Rejected']]
  var a_names = attatch_2d([c.content_teams,c.content_names]).map(row => row.map(e => String(e)));
  //av width: 595.276 //cwf: column width factor
  
  var cw_base_prbs = [1,5]; // #&name
  var n = 1
  cw_base_prbs = cw_base_prbs.concat([n,n,n,n,n,n]); //reported prbs
  cw_base_prbs = cw_base_prbs.concat([n,n,n,n,n,n]); //opposed prbs
  cw_base_prbs = cw_base_prbs.concat([n,n,n,n,n,n]); //reviewed prbs
  cw_base_prbs = cw_base_prbs.concat([6,6,6,6,6,6]); //rejected prbs

  var cwf_prbs = 800/(cw_base_prbs.reduce((a, b) => a + b, 0));
  // var cw_prbs = cw_base_prbs.map(cw => Math.round(cw*( cwf_prbs )))
  var cw_prbs = cw_base_prbs.map(cw => cw*( cwf_prbs ))

  var cw_prbs_header = [
    cw_prbs.slice(0,2).reduce((a, b) => a + b, 0),
    cw_prbs.slice(2,8).reduce((a, b) => a + b, 0),
    cw_prbs.slice(8,14).reduce((a, b) => a + b, 0)+1,
    cw_prbs.slice(14,20).reduce((a, b) => a + b, 0)+2,
    cw_prbs.slice(20,26).reduce((a, b) => a + b, 0)+2
  ]

  var st_btw_tables = {}
  st_btw_tables[DocumentApp.Attribute.LINE_SPACING] = 0.1;
  body.appendParagraph('Problems Sequence');
  body.appendParagraph(' ').editAsText().setFontSize(1).setAttributes(st_btw_tables).merge();

  var t_prbs_header = body.appendTable(a_prbs_header);
  var t_prbs        = body.appendTable(a_prbs);

  var st_prbs_header = table_set_style(t_prbs_header, cw_prbs_header,8,undefined,false,[2,1,1,1])
  var st_prbs        = table_set_style(t_prbs       , cw_prbs       ,8,undefined,false,[2,1,1,1])

  // // Log the attributes.
  // var atts = t_prbs_header.getRow(0).getAttributes();
  // for (var att in atts) {
  //   Logger.log(att + ":" + atts[att]);
  // }
  if(include_confirm){add_confirm(body,["Evaluator","Administrator"],"l",2);}


  // names
  body.appendPageBreak();

  var a_names = slice_2d(attatch_2d([c.content_teams,c.content_names]).map(row => row.map(e => String(e))),[2,0]);
  var a_names_header = [['','Reporter','Opponent','Reviewer']];

  var cw_base_names = [1,5];
  var n = 3
  cw_base_names = cw_base_names.concat([n,n,n,n,n,n]); //Reporter names
  cw_base_names = cw_base_names.concat([n,n,n,n,n,n]); //Opponent names
  cw_base_names = cw_base_names.concat([n,n,n,n,n,n]); //Reviewer names
  var cwf_names = 800/(cw_base_names.reduce((a, b) => a + b, 0));
  var cw_names = cw_base_names.map(cw => cw*( cwf_names ));

  var cw_names_header = [
    cw_names.slice(0,2).reduce((a, b) => a + b, 0),
    cw_names.slice(2,8).reduce((a, b) => a + b, 0)-2,
    cw_names.slice(8,14).reduce((a, b) => a + b, 0)-1,
    cw_names.slice(14,20).reduce((a, b) => a + b, 0)-1
  ]
  
  body.appendParagraph('Presenters Sequence').setHeading(DocumentApp.ParagraphHeading.NORMAL);
  body.appendParagraph(' ').editAsText().setFontSize(1).setAttributes(st_btw_tables).merge();

  var t_names_header = body.appendTable(a_names_header);
  var t_names        = body.appendTable(a_names);

  var st_names_header = table_set_style(t_names_header, cw_names_header,8,undefined,false,[2,1,1,1])
  var st_names        = table_set_style(t_names       , cw_names       ,8,undefined,false,[2,1,1,1])

  if(include_confirm){add_confirm(body,["Evaluator","Administrator"],"l",2);}

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]

}

function gen_sel(doc_in = undefined,out_doc = true, out_pdf = true,include_confirm = false){
  var doc = null;
  var name = `[${get_full_name()}] selection verdict ${get_now()}`;

  if(doc_in == undefined){doc =  doc_init(name);}
  else{
    doc = doc_in;
    doc.appendPageBreak();
  }
  var body = doc.getBody();
  var doc_id=doc.getId();

  var sel = new Select();
  sel.pharse(0);

  var p_title = body.getParagraphs()[0];
  p_title.appendText("Selection Problems Verdict");
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var p_note = body.appendParagraph('See tournament regulations for rules on problems selection.');
  p_note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  p_note.editAsText().setFontSize(8);
  body.appendParagraph('').setItalic(false).merge();

  var a_sel = sel.roster;
  for(var pf_num of sel.sel_pf_nums){
    a_sel = attatch_2d([a_sel,sel.verdicts[pf_num]])
  }
  a_sel = [[" "," "].concat(sel.sel_pf_nums.map(e => `PF${e}`))].concat(a_sel)
  // Logger.log(string_2d(a_sel))
  a_sel = a_sel.map(row => row.map(e => String(e)));

  var t_sel = body.appendTable(a_sel);
  var cw_sel = [20,130].concat(Array(sel.sel_pf_nums.length).fill(30));
  var st_sel = table_set_style(t_sel,cw_sel,10,undefined,true);

  if(include_confirm){add_confirm(body,['Administrator'],'p',2);}

  var pdf = null;
  if(out_pdf){
    pdf = generate_pdf(doc);
    doc = DocumentApp.openById(doc_id);
  }
  return [doc,pdf]
}

// TODO
// typ options for gen_rm
// function populate_capture_templates(){}
// function populate_write_templates(){}


