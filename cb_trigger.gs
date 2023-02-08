function onSubmit(form_data){
  Logger.log(`Chatbot Instruction Submitted.\nSPEC: PF${form_data.pf} RM${form_data.rm} ST${form_data.st},\nUSER: ${user_get_id()}\nCMD : ${form_data.cmd}`);
  var chat = new Chat(form_data.pf,form_data.rm,form_data.st);
  if(form_data.cmd != ''){chat.add_cmd(String(form_data.cmd));}
  chat.execute_all();
  Logger.log(`Finished\n${chat.toString()}`);
  return [chat.html_status(),chat.html_quotes(),chat.html_tooltip()];
}

function read_cmd_log(pf=3,rm=1,st=2){
  Logger.log(get_prop_value(`cmdlog_p${pf}r${rm}s${st}`,"s"))
}

function read_all_cmd_logs(){
  Logger.log('Reading all cmd logs:\n'+read_props('cmdlog_','s',false))
}

function remove_all_cmd_logs(){
  delete_props("cmdlog",'s',false);
}