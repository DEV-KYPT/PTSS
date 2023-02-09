function onSubmit(form_data){
  var ms = get_milisec();
  var ms_start = ms;

  // Logger.log(`[CB-UI][${get_now()}] Chatbot Instruction Submitted. <${user_get_id()}>`);
  Logger.log(`[CB-UI] Chatbot Instruction Submitted.\n[PF${form_data.pf} RM${form_data.rm} ST${form_data.st}]\n${user_get_id()}>> ${form_data.cmd}`);

  Logger.log(`[CB-UI][+${get_milisec()-ms}ms] Firstline.`);
  ms = get_milisec();

  var chat = new Chat(form_data.pf,form_data.rm,form_data.st);
  Logger.log(`[CB-UI][+${get_milisec()-ms}ms] Chatbot Instance Created. (cached at ${chat.cache_time})`);
  ms = get_milisec();

  if(form_data.cmd != ''){chat.add_cmd(String(form_data.cmd));}
  chat.execute_all();
  Logger.log(`[CB-UI][+${get_milisec()-ms}ms]Chatbot Computation Finished\n\n${chat.toString()}`);
  ms = get_milisec();

  var status = chat.html_status();
  var quotes = chat.html_quotes();
  var tooltip= chat.html_tooltip();
  Logger.log(`[CB-UI][+${get_milisec()-ms}ms]Response Generated\n\n${chat.toString()}`);
  ms = get_milisec();

  Logger.log(`[CB-UI] Total elapsed time: ${get_milisec() - ms_start}ms`)
  return [status,quotes,tooltip];
}

function read_chat_log(pf=1,rm=2,st=3){
  Logger.log(get_prop_value(`chat_p${pf}r${rm}s${st}`,"s"))
}

function read_all_chat_logs(){
  Logger.log('Reading all cmd logs:\n'+read_props('chat_','s',false))
}

function remove_all_chat_logs(){
  delete_props("chat_",'s',false);
}