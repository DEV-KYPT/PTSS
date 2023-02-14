// Initialization
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
  //typ(e): r:result, wt:write template, ct: capture template
  var doc = DocumentApp.create(name);
  var docId = doc.getId()
  if(typ!="r"){DriveApp.getFileById(docId).moveTo(DriveApp.getFolderById(get_prop_value('template-id','d')));}
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
    if(typ == "r"){doc.addFooter().getParagraphs()[0].setAlignment(DocumentApp.HorizontalAlignment.RIGHT).appendText(get_now());}
  }

  doc.setMarginBottom(5);
  doc.setMarginTop(5);
  doc.setMarginLeft(15);
  doc.setMarginRight(15);

  doc_set_header_margin(doc,3)
  
  return doc;
}

// Table Handling
function table_set_style(table,columnWidths,fontSize = 9,style = null,centered = false,padding = [3,1,2,2]){
  if(style == null){ //default style
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

// PDF conversion
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

// Pre/post processing routines
function doc_preprocess(doc_in = null,name = '[DOC]',orientation = 'p',header = true,typ = 'r'){
  var doc = null;
  if(doc_in == null){doc =  doc_init(name,orientation,header,typ);}
  else                   {doc = doc_in;}

  var body   = doc.getBody();

  var p_1 = null
  if(doc_in == null){p_1 = doc.getParagraphs()[0];}
  else                   {body.appendPageBreak();p_1 = doc.appendParagraph('');}

  return [doc,body,p_1];
}

function doc_postprocess(doc,out_pdf = true){
  var doc_id = doc.getId();
  var pdf = null;
  if(out_pdf){pdf = generate_pdf(doc);}
  else       {doc.saveAndClose();}
  doc = DocumentApp.openById(doc_id);
  return [doc,pdf]
}

// Stage adders
function add_st(st,body,typ = "r"){ //add a [St] instance as a neat table to the given document body
  //typ: r: result, wt: write template, ct: capture template
  var s_pre_data = null;
  if(typ == "r"){s_pre_data = `Stage ${st.st_num} \t\tAccepted Problem: ${st.challenge["acc"]} \t\tRejected Problem(s): ${st.challenge["rej"].toString()}`}
  else         {s_pre_data  = `Stage ${st.st_num} \t\tAccepted Problem: ${st.challenge["acc"]} \t\tRejected Problem(s): `} // why not add it if it's there?

  var p_pre_data = body.appendParagraph(s_pre_data).setHeading(DocumentApp.ParagraphHeading.NORMAL);

  if(typ != "ct"){
    var a = st.result; //(array of results)
    for(var idx = 1;idx<a.length;idx++){
      a[idx][a[0].length-1] = Math.round(a[idx][a[0].length-1]*100)/100
    }
    if(typ != "r"){a = clear_2d(a,[1,1])} // clear result portion

    a = a.map(row => row.map(e => String(e)));

    var table = body.appendTable(a);
    var col_w = [80,40,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]; //av width: 595.276
    var style_table = table_set_style(table,col_w,9,null,true,[2,1,1,1]);
  }
  else{ // add team names and name placeholders
    p_pre_data.setFontSize(13).editAsText().setBold(true);
    if(st.st_num == 1){p_pre_data.merge();}
    body.appendParagraph(' ').setFontSize(6);
    body.appendParagraph(`Reporter Team: ${st.challenge.rep_team}\t\t Reporter Name: `).setHeading(DocumentApp.ParagraphHeading.NORMAL);
    body.appendParagraph('IMAGE');
    body.appendParagraph(`Opponent Team: ${st.challenge.opp_team}\t\t Opponent Name: `);
    body.appendParagraph('IMAGE');
    body.appendParagraph(`Reviewer Team: ${st.challenge.rev_team}\t\t Reviewer Name: `);
    body.appendParagraph('IMAGE');
    
    body.appendPageBreak();
    return null;
  }

  var s_post_data = '\n'
  if(st.challenge["penalty"] && typ == "r"){s_post_data += `Reporting Team Reached ${st.challenge["nrej"]} Rejects. Calculated Reporter Weight is ${st.challenge["weight"]}`}
  var t_post_data = p_pre_data.appendText(s_post_data);
  t_post_data.setFontSize(8).setItalic(true);
  return table
}

function add_finst(finst,body,typ = "r"){
  var s_pre_data = null;
  if(typ == "r"){s_pre_data = `Stage ${finst.st_num} \t\tProblem: ${finst.prb}`}
  else          {s_pre_data = `Stage ${finst.st_num} \t\tProblem: ${finst.prb}`}
  var p_pre_data = body.appendParagraph(s_pre_data).setHeading(DocumentApp.ParagraphHeading.NORMAL);

  if(typ != "ct"){
    var a = finst.result; //(array of results)
    for(var idx = 1;idx<a.length;idx++){
      a[idx][a[0].length-1] = Math.round(a[idx][a[0].length-1]*100)/100
    }
    if(typ != "r"){a = clear_2d(a,[1,1])} // clear result portion

    a = a.map(row => row.map(e => String(e)));

    var cw_base = [8,4]
    for(var i = 0;i<26;i++){cw_base.push(2);}
    var cwf = 800/(cw_base.reduce((a, b) => a + b, 0));
    var cw = cw_base.map(cw => cw*cwf)
    // Logger.log(cw_base)
    // Logger.log(cw)

    var table = body.appendTable(a);
    
    var style_table = table_set_style(table,cw,8,null,false,[0,0,0,0]);
    return table
  }
  else{ // add team names and name placeholders
    p_pre_data.setFontSize(13).editAsText().setBold(true);
    if(finst.st_num == 1){p_pre_data.merge();}
    body.appendParagraph(' ').setFontSize(6);
    body.appendParagraph(`Reporter Team: ${finst.rep_team}\t\t Reporter Name: `).setHeading(DocumentApp.ParagraphHeading.NORMAL);
    body.appendParagraph('IMAGE');
    body.appendParagraph(`Opponent Team: ${finst.opp_team}\t\t Opponent Name: `);
    body.appendParagraph('IMAGE');
    body.appendParagraph(`Reviewer Team: ${finst.rev_team}\t\t Reviewer Name: `);
    body.appendParagraph('IMAGE');
    
    body.appendPageBreak();
    return null;
  }
}

function add_summary(rm,body,typ = "r",final = false){ //add a summary of [Rm] instance as a neat table to the given document body
  body.appendParagraph("Results").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  var metric = "fw";
  if(final)(metric = "rank")

  var a_result = [["Team","Score",metric.toUpperCase()],['','',''],['','',''],['','',''],['','','']];
  
  for(var row = 1; row <= 4; row++){
    a_result[row][0] = rm.roster[row-1][1];
    if(typ == "r"){
      a_result[row][1] = Math.round(rm.summary["scr"][row-1][0]*1000)/1000;
      a_result[row][2] = String(rm.summary[metric][row-1][0]);
    }
  }
  // Logger.log(a_result)
  var t_result = body.appendTable(a_result);
  var style_result = table_set_style(t_result,[100,35,30]);
  style_result[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.CENTER;
  t_result.setAttributes(style_result);
  return t_result;
}

// adding confirmation section
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
  p_signature.setHeading(DocumentApp.ParagraphHeading.NORMAL).setFontFamily("Ubuntu Mono").setBold(true);
  return body;
}

// Round documents
function gen_rm_r(rm_obj = null,pf = 4,rm = 3,doc_in = null,out_doc = true,out_pdf = true){

  var r = null;
  if(rm_obj == null){r = new Rm(pf,rm);r.parse(1);}
  else              {r = rm_obj;}

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] pf${pf}-rm${rm} ${get_now()}`);

  p_title.appendText(`[PF${pf} - Room${rm}] Result`)
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var s_info = `PF ${r.pf_num}, Room ${r.rm_num} (${r.rm_loc})\nTimekeeper: ${r.tk}, Scorekeeper: ${r.sk}`;
  var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  var s_note = 'Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers.';
  var p_note = body.appendParagraph(s_note).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true).editAsText().setFontSize(8);

  var tb_tables = [];
  for(var stage of r.st.slice(1)){tb_tables.push(add_st(stage,body,'r'));}

  var tb_summary = add_summary(r,body,'r');

  add_confirm(body,['Evaluating Timekeeper','Administrative Juror'],'p',2);

  return doc_postprocess(doc,out_pdf);
}

function gen_rm_wt(rm_obj = null,pf = 5,rm = 7,doc_in = null,out_doc = true,out_pdf = true){

  var r = null;
  if(rm_obj == null){r = new Rm(pf,rm);r.parse(1);}
  else              {r = rm_obj;}

  var [doc,body,p_title] = doc_preprocess(doc_in,`[WRITE TEMPLATE] pf${pf}-rm${rm}`,'p',true,'wt');

  p_title.appendText(`Scoring Template (PF${pf}-RM${rm})`);
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var s_info = `PF ${r.pf_num}, Room ${r.rm_num} (${r.rm_loc})\nTimekeeper: ______, Scorekeeper: ______`;
  var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  var tb_tables = [];
  for(var stage of r.st.slice(1)){tb_tables.push(add_st(stage,body,'wt'));}

  var tb_summary = add_summary(r,body,'wt');

  add_confirm(body,['Chair Juror'],'p',2);

  return doc_postprocess(doc,out_pdf)
}

function gen_rm_ct(rm_obj = null,pf = 5, rm = 7,doc_in = null,out_doc = true,out_pdf = false){

  var r = null;
  if(rm_obj == null){r = new Rm(pf,rm);r.parse(1);}
  else              {r = rm_obj;}

  var [doc,body,p_title] = doc_preprocess(doc_in,`[CAPTURE TEMPLATE] pf${pf}-rm${rm}`,'p',true,'ct');

  var p_title_header = doc.getHeader().appendParagraph('').setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  var t_title = p_title_header.appendText("Scoring Template")
  var t_info = p_title_header.appendText(` - PF ${r.pf_num}, Room ${r.rm_num} (${r.rm_loc})`)
  var t_staff = p_title_header.appendText(`\nTimekeeper: ??? / Scorekeeper: ???`);
  t_title.setFontSize(12).setBold(true);
  t_staff.setFontSize(9);

  for(var stage of r.st.slice(1)){add_st(stage,body,'ct');}

  // add_confirm(body,['Chair Juror'],'p',2);
  var p_confirm_footer = doc.addFooter().getParagraphs()[0]
  p_confirm_footer.setAlignment(DocumentApp.HorizontalAlignment.LEFT)
  p_confirm_footer.appendText('Confirmation of Chair Juror  \t Name __________ Signature ___________________');
  p_confirm_footer.editAsText().setFontFamily("Ubuntu Mono").setFontSize(12).setBold(true)

  return doc_postprocess(doc,out_pdf)  
}

// Finals documents
function gen_fin_r(doc_in = null,out_doc = true,out_pdf = true){
  var finr = new Finrm();
  finr.parse(1);

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] final ${get_now()}`,'l');

  p_title.appendText(`${get_full_name()} Final Round Result`)
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var s_info = `Timekeepers: ${finr.tk}\nScorekeepers: ${finr.sk}`;
  var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  var s_note = 'Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers.';
  var p_note = body.appendParagraph(s_note).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true).editAsText().setFontSize(8);

  var tb_tables = [];
  for(var stage of finr.finst.slice(1)){tb_tables.push(add_finst(stage,body,'r'));}

  var tb_summary = add_summary(finr,body,'r',true);

  add_confirm(body,['Evaluating Timekeeper','Administrative Juror','Administrator'],'p',2);
    return doc_postprocess(doc,out_pdf);

}

function gen_fin_wt(doc_in = null,out_doc = true,out_pdf = true){

  var finr = new Finrm();  // the room instance
  finr.parse(1);

  var [doc,body,p_title] = doc_preprocess(doc_in,`[WRITE TEMPLATE] final`,'l',true,'wt');

  p_title.appendText("Scoring Template")
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var s_info = `Timekeepers: ______, ______, ______, ______, ______\nScorekeepers: ______, ______, ______, ______, ______`;
  var p_info =  body.appendParagraph(s_info).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  var tb_tables = [];
  for(var stage of finr.finst.slice(1)){tb_tables.push(add_finst(stage,body,'wt'));}

  var tb_summary = add_summary(finr,body,'wt',true);

  add_confirm(body,['Chair Juror'],'p',2);

  return doc_postprocess(doc,out_pdf)
}

function gen_fin_ct(doc_in = null,out_doc = true,out_pdf = false){
  var finr = new Finrm();  // the room instance
  finr.parse(1);

  var [doc,body,p_title] = doc_preprocess(doc_in,`[CAPTURE TEMPLATE] final`,'l',true,'ct');

  var p_title_header = doc.getHeader().appendParagraph('').setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  var t_title = p_title_header.appendText("Scoring Template")
  var t_info = p_title_header.appendText(` - Final Round`)
  var t_staff = p_title_header.appendText(`\nTimekeepers: ??? / Scorekeepers: ???`);
  t_title.setFontSize(12).setBold(true);
  t_staff.setFontSize(9);

  for(var stage of finr.finst.slice(1)){add_finst(stage,body,'ct');}

  // add_confirm(body,['Chair Juror'],'p',2);
  var p_confirm_footer = doc.addFooter().getParagraphs()[0]
  p_confirm_footer.setAlignment(DocumentApp.HorizontalAlignment.LEFT)
  p_confirm_footer.appendText('Confirmation of Chair Juror  \t Name __________ Signature ___________________');
  p_confirm_footer.editAsText().setFontFamily("Ubuntu Mono").setFontSize(12).setBold(true)

  return doc_postprocess(doc,out_pdf)  
}

// PF-level document generations
function gen_pf_r(pf_obj = null,pf = 5,out_doc = true,out_pdf = true){
  var doc = gen_board(pf,null,true,false,true)[0];
  doc.setName(`[${get_full_name()}] pf${pf} ${get_now()}`);
  var doc_id = doc.getId();

  var p = null;
  if(pf_obj == null){p = new Pf(pf);p.parse(3);}
  else              {p = pf_obj;}
  // Logger.log(p.rm[3].interpret(3))

  // if(pf != b.current_pf){
  //   Logger.log("Input PF number does not equal current scoreboard!");
  //   return [false,null]
  // }

  for(var rm = 1;rm <= p.len_rm;rm++){
    doc = gen_rm_r(p.rm[rm],pf,rm,doc,true,false,'r')[0];
    Logger.log(`[GEN-PF] Generation for PF${pf} RM${rm} Complete`)
  }

  return doc_postprocess(doc,out_pdf)

}

function gen_pf_wt(pf_obj = null,pf = 6,out_pdf = true){ //generate write templates for given PF (all wt takes too long.)
  // var t = new Tournament();
  // t.parse(0);

  var p = null;
  if(pf_obj == null){p = new Pf(pf);p.parse(3);}
  else              {p = pf_obj;}

  Logger.log(`[GEN-WT] Generating Write Template for PF${pf}`);

  var doc = gen_rm_wt(p.rm[1],pf,1,null,true,false)[0];
  Logger.log(`[GEN-WT] PF${pf} RM1 Complete.`);

  doc.setName(`[WRITE TEMPLATE] pf${pf}`)
  for(var rm = 2;rm<=p.len_rm;rm++){
    doc = gen_rm_wt(p.rm[rm],pf,rm,doc,true,false)[0];
    Logger.log(`[GEN-WT] PF${pf} RM${rm} Complete.`);
  }

  return doc_postprocess(doc,out_pdf)
}

function gen_pf_ct(pf_obj = null,pf = 3,out_pdf = false){
  // var t = new Tournament();
  // t.parse(0);

  var p = null;
  if(pf_obj == null){p = new Pf(pf);p.parse(3);}
  else              {p = pf_obj;}

  Logger.log(`[GEN-CT] Generating Capture Template for PF${pf}`);

  for(var rm = 1;rm<=p.len_rm;rm++){
    gen_rm_ct(p.rm[rm],pf,rm,null,true,false);
    Logger.log(`[GEN-CT] PF${pf} RM${rm} Complete.`);
  }
}

// Tournament-general documents
function gen_draw(doc_in = null,out_doc = true, out_pdf = true,include_confirm = true){

  var d = new Draw();
  d.parse(0);

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] draw ${get_now()}`,'p');

  p_title.appendText("Tournament Draw");
  p_title.setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var p_note = body.appendParagraph('The order of teams listed (top to bottom) correspond to teams starting as Reporter, Opponent, Reviewer, Observer, Respectively.');
  p_note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  p_note.editAsText().setFontSize(8);
  body.appendParagraph('').setItalic(false);

  var a_draw = d.draw_full;

  for(var i = 1;i < a_draw[0].length;i += 2){a_draw = clear_2d(a_draw,[0,i],[a_draw.length-1,i]);}
  // Logger.log(string_2d(a_draw))
  
  var t_draw = body.appendTable(a_draw);
  var cwf_draw = 560/(2+5.5*d.len_rm); //av width: 595.276 //cwf: column width factor
  var cw_draw = [2*cwf_draw];
  for(var i = 0;i<d.len_rm;i++){cw_draw = cw_draw.concat([0.5*cwf_draw,5*cwf_draw]);}

  var st_draw = table_set_style(t_draw,cw_draw,9,null,true,[2,1,1,1]);

  // roster
  var a_roster = d.draw_roster.map(row => row.map(e => String(e)));
  var col_len = 12; //number of teams to include in one col.
  var a_roster_cut = [];
  for(var i = 0;i<=d.num_teams;i += col_len){
    var j = i + col_len;
    if(j > d.num_teams){j = d.num_teams};
    // Logger.log([i,j,d.num_teams])
    a_roster_cut.push(a_roster.slice(i,j));
    a_roster_cut.push([[" "]]);//empty column for spacing
  }
  
  var a_header = [["Draw","Team Name"]];
  for(var col = 0;col<a_roster_cut.length;col+=2){a_roster_cut[col] = a_header.concat(a_roster_cut[col]);}
  // Logger.log(multistring_2d(a_roster_cut))
  var a_roster_processed = attatch_2d(a_roster_cut);
  // Logger.log(string_2d(a_roster_processed,null,0,true))

  body.appendParagraph("Draw Placement").setHeading(DocumentApp.ParagraphHeading.NORMAL);
  var t_roster_cut = body.appendTable(a_roster_processed);
  var cwf_roster = 560/(6.5*(a_roster_cut.length/2));
  var cw_roster = [];
  for(var i = 0;i<a_roster_cut.length/2;i++){cw_roster = cw_roster.concat([1.5*cwf_roster,4.5*cwf_roster,0.5*cwf_roster]);}
  // Logger.log(cw_roster)

  var st_roster = table_set_style(t_roster_cut,cw_roster,9,null,true,[2,1,1,1]);

  if(include_confirm){add_confirm(body,['Administrator'],'p',2);}

  return doc_postprocess(doc,out_pdf)
}

function gen_board(pf = 5,doc_in = null,out_doc = true,out_pdf = true,include_confirm = true){
  var b = new Board(pf);
  b.parse();

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] scoreboard pf${b.current_pf} ${get_now()}`);

  p_title.appendText(`Scoreboard (up to PF${b.current_pf})`)
  p_title.setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var p_note =  body.appendParagraph('Note: Numbers here are rounded, while the scoring system calculates un-rounded numbers');
  p_note.setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setItalic(true);
  p_note.editAsText().setFontSize(8);
  p_note.appendText('.').setItalic(false);
  // body.appendParagraph('').setItalic(false);

  var tb = doc.appendTable(b.content_rank.map(row => row.map(e => String(e))));
  var style = table_set_style(tb,[140,40,40,40,40,40,40,70,70,40],11,null,true,[2,1,1,1]);

  if(include_confirm){add_confirm(body,['Evaluator','Administrator'],'p',3);}

  return doc_postprocess(doc,out_pdf)

}

function gen_db(doc_in = null,out_doc = true,out_pdf = true,include_confirm = false){
  var c = new Core();
  c.parse();

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] database ${get_now()}`,'l');
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

  var st_prbs_header = table_set_style(t_prbs_header, cw_prbs_header,8,null,false,[2,1,1,1])
  var st_prbs        = table_set_style(t_prbs       , cw_prbs       ,8,null,false,[2,1,1,1])

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

  var st_names_header = table_set_style(t_names_header, cw_names_header,8,null,false,[2,1,1,1])
  var st_names        = table_set_style(t_names       , cw_names       ,8,null,false,[2,1,1,1])

  if(include_confirm){add_confirm(body,["Evaluator","Administrator"],"l",2);}

  return doc_postprocess(doc,out_pdf)
}

function gen_sel(doc_in = null,out_doc = true, out_pdf = true,include_confirm = false){
  var sel = new Select();
  sel.parse(0);

  var [doc,body,p_title] = doc_preprocess(doc_in,`[${get_full_name()}] selection verdict ${get_now()}`);
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
  var st_sel = table_set_style(t_sel,cw_sel,10,null,true);

  if(include_confirm){add_confirm(body,['Administrator'],'p',2);}

  return doc_postprocess(doc,out_pdf);
}
