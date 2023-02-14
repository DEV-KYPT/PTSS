class Quote{ 
  //Chat instance contains an array of Quote instances.
  //serialized: formatted as a script property:
  //key:chat_p?r?s?
  //value:
  //<userid>++<time>++<cmd>     (--> parsed as a Quote Instance)
  //(\n)<userid>++<time>++<cmd> (--> parsed as a Quote Instance)

  //Quote instances also have a "resp" property, which makes it easy to bookkeep and show outputs
  constructor(cmd_string = null){ // formatted: (userID)++(timestamp)++(command)
    this.user_id = null;
    this.time    = null;
    this.cmd     = null;
    if(cmd_string != null){this.parse(cmd_string);}

    this.resp = '';
    this.resp_typ = 'default';
  }

  parse(cmd_string){
    [this.user_id,this.time,this.cmd] = cmd_string.split('++');
    // Logger.log(`parsed cmd:[${this.cmd}]`)
  }

  toString(){
    var output = `Quote [id:${this.user_id}] [t:${this.time}] [cmd:${this.cmd}]`
    if(this.resp != ''){return output + `\nresponse:[${this.resp}]`}
    else{return output `\n(no response)`}
  }

  output_cmd(as_html = false){
    var output = `${this.user_id.slice(0,10)}>> ${this.cmd}`;
    if(as_html){return `${this.user_id.slice(0,10)}>> ${html(this.cmd,'cmd')}`;}
    else       {return `${this.user_id.slice(0,10)}>> ${this.cmd}`}
  }

  output_resp(as_html = false){
    if(as_html){return html(this.resp,this.resp_typ);}
    return this.resp;
  }

  output_html(){
    return `${this.output_cmd(true)}<br>${this.output_resp(true)}`;
  }

  serialize(){
    return `${this.user_id}++${this.time}++${this.cmd}`
  }
}

class Chat{
  constructor(pf,rm,st,verbose = false){
    this.pf = pf;
    this.rm = rm;
    this.st = st;

    this.cache_key = `chat_p${pf}r${rm}s${st}`;
    this.prop_key  = `chat_p${pf}r${rm}s${st}`;

    // (potentailly) cached variables
    this.c = null;
    this.r = null;
    this.cache_time = null;

    // Logger.log(`[Chat][${get_now(true)}] Challenge parsed`);

    this.overwrite = null; // true when some data is written in challenge

    this.quotes = null;

    this.phase = null;
    //n: new (i), c: awaiting challenged problem (1~17), d: awatiing decision (a/r), f: challenge finished (w), x: written and finished(no actions possible)

    this.cmd_spec = {// <cmd prototype>:[possible phases,description,html typ] (left at constructor since it doesn't normally change)
      "i"     :["n"    ,"initialize chat session","default"  ],
      "a"     :["d"    ,"accept problem"         ,"accept"   ],
      "r"     :["d"    ,"reject problem"         ,"reject"   ],
      "u"     :["ncdf" ,"undo last command"      ,"undo"     ],
      "w"     :["f"    ,"write result into DATA" ,"write"    ]
    }
    this.parse();
  }

  parse(verbose = false){
    var ms = get_milisec();
    var ms_start = ms;

    var cache_obj = cache_get(this.cache_key);
    
    if(cache_obj != null){
      if(true){Logger.log(`[Chat-INIT] [${this.cache_key}] Cache Detected! [cached at ${cache_obj.cache_time}]`);}
      this.c = new Challenge(this.pf,this.rm,this.st,cache_obj.c);
      this.c.parse();
      this.r = new Rule(cache_obj.r)
      this.cache_time = cache_obj.cache_time
    }
    else{
      this.c = new Challenge(this.pf,this.rm,this.st);
      this.c.parse();
      this.r = new Rule();
      this.cache_time = get_now(true);
      cache_set(this.cache_key,this);
      if(true){Logger.log(`[Chat-INIT] New cache set: [${this.cache_key}] [cached at ${this.cache_time}]`);}
    }
    // Logger.log(`[Chat][${get_now(true)}] Challenge parsed`);

    if(verbose){Logger.log(`[Chat-INIT][+${get_milisec() - ms}] Initialize Challenge/Rule`);}
    ms = get_milisec();

    this.overwrite = this.c.ignore_written_results(); // true when some data is written in challenge

    if(this.is_empty()){this.init();}
    else               {this.load();}

    if(verbose){Logger.log(`[Chat-INIT][+${get_milisec() - ms}] Handle overwrite / Load quotes`);}
    ms = get_milisec();

    this.phase = "n"; //n: new (i), c: awaiting challenged problem (1~17), d: awatiing decision (a/r), f: challenge finished (w), x: written and finished(no actions possible)

    var temp_str = `${this.r.all_prbs[0]}~${this.r.all_prbs[this.r.all_prbs.length-1]}`;
    this.cmd_spec[temp_str] = ["c"    ,"challenge a problem"    ,"challenge"];
    this.cmd_spec["x"] = ["ncdf",null,null]
    // hidden commands
      // "c":["ncdf","clear all","undo"],
      // "x":["ncdf","clear cache","err"]
    for(var p of this.r.all_prbs){
      this.cmd_spec[String(p)] = ["c",null,null];
    }

    if(verbose){Logger.log(`[Chat-INIT][+${get_milisec() - ms}] Setting command specs`);}
    if(verbose){Logger.log(`[Chat-INIT] Total Elapsed: ${get_milisec() - ms_start}ms`);}
  }

  is_empty(){return get_prop_value(this.prop_key,"s") == null;}

  // backend (via propertyservice / cacheservice)
  init(){
    var s_init = `${user_get_id()}++${get_now()}++init`
    this.quotes = [new Quote(s_init)];
    this.save();
    return s_init;
  }

  save(){
    var s_output = '';
    for(var q of this.quotes){s_output += `${q.serialize()}\n`;}
    // Logger.log(s_output)
    set_prop(this.prop_key,s_output,"s");
  }

  load(){
    var s_raw = get_prop_value(this.prop_key,"s");
    if(s_raw == null){return null;}
    this.quotes = [];
    for(var s of filter_empty(s_raw.split("\n"))){this.quotes.push(new Quote(s));}
  }

  clear_cache(){
    Logger.log(`[CHAT] Clearing Cache`);
    cache_set(this.cache_key,null);
  }

  // command logic
  add_cmd(cmd){ //part of onSubmit trigger
    cmd = String(cmd).replace('\n','');
    if (cmd[0] == "x"){this.clear_cache();this.parse();}

    if      (cmd[0] == "u"){this.pop_last();}
    else if (cmd[0] == "c"){this.init();}
    else                   {this.quotes.push(new Quote(`${user_get_id()}++${get_now()}++${cmd}`));}

    if      (!(["w","x"].includes(cmd[0]))){this.save();} //the write / clear cache command is only executed once, and never saved
  }

  check_cmd(cmd){ //check if a given command is valid in current phase
    if(this.phase != "c"){cmd = cmd[0];}
    if(this.cmd_spec[String(cmd)[0]] == null && this.cmd_spec[String(cmd)] == null){return false;}
    if(this.phase == 'c'){return this.cmd_spec[String(cmd)   ][0].includes(this.phase)}
    else                 {return this.cmd_spec[String(cmd)[0]][0].includes(this.phase);}
    return false;
  }

  pop_last(){ // for "undo" command
    if(this.quotes.length >= 2){this.quotes.pop();}
  }

  // debug output
  toString(){
    var output = `Chat [PF${this.pf}-RM${this.rm}-ST${this.st}] [PHASE: ${this.phase}] [${this.prop_key}]`;
    output += `\n-----QUOTES-----`
    for(var q of this.quotes){output += `\n${q}`;}
    output += `\n----------------`

    output += `\n${this.c.interpret()}`;
    return output;
  }

  // cache output
  toJSON(){
    return {
      c : this.c,
      r : this.r,
      cache_time : this.cache_time
    }
  }

  // COMPUTATION (the functions starting with "execute" participate in response generation)
  execute_init(){
    // this.active_rules = ['B','P','a','b','c','d'];
    this.active_rules = ['d','c','b','a','P','B'];
    this.relaxed_rules= [];

    this.stabilize();

    this.challenged = 0;

    this.cursor_idx = 1; //the next command to process
    this.phase = "c";

    this.table = {
      "teams" :[[]],
      "prbs"  :[[]],
      }; //2d tables for representing available questions

    // this.c.highlight(); //activate current stage (SLOW)

    // add response to the first quote object (which must always be "init")
    this.quotes[0].resp = `[ PF${this.pf} RM${this.rm} ST${this.st} ] Initialized`;
    if(this.overwrite)    {this.quotes[0].resp += html("\n[WARN] Ignoring written data. [w] command will overwrite them.",'warn');}
    this.quotes[0].resp += this.read_relaxed(this.relaxed_rules,true);

    if(this.c.select){
      this.quotes[0].resp  = `[ PF${this.pf} RM${this.rm} ST${this.st} ] Initialized`;
      this.quotes[0].resp += `\n${html(`Pre-selected Stage: [#${this.c.acc}]`,'accept')}`;
      this.relaxed_rules = []; //special case for pre-selected challenges
      this.active_rules  = ['d','c','b','a','P','B'];
      // this.quotes[0].resp_type = 
      this.phase = 'f';
    }

  }

  relax_once(){
    if(this.active_rules.length < 2){Logger.log("ERROR: ALL RULES REMOVED!")}
    var relaxed_rule = this.active_rules[0];
    this.relaxed_rules.push(relaxed_rule);

    this.active_rules.splice(0,1);

    return relaxed_rule;
  }

  stabilize(){
    var new_relaxed_rules = [];
    Logger.log(`Rule MA: ${this.r.ma}`)
    Logger.log(`Before Stabilizing: active rules: ${this.active_rules}, available prbs: ${this.c.available[this.active_rules[0]]} (len: ${this.c.available[this.active_rules[0]].length})`)
    while(this.c.available[this.active_rules[0]].length < this.r.ma){new_relaxed_rules.push(this.relax_once());}
    Logger.log(`After Stabilizing: active rules: ${this.active_rules}, available prbs: ${this.c.available[this.active_rules[0]]} (len: ${this.c.available[this.active_rules[0]].length})`)
    return new_relaxed_rules;
  }

  read_conflicts(conflicts,as_html = true){
    var output = 'Conflicts: ';
    if(conflicts.length == 0){output = '(no conflicts)'}
    for(var r of conflicts){output += `\n${r}: ${this.r.desc[r]}`}
    if(as_html){return html(output,'conflict');}
    else{return output;}
  }

  read_relaxed(relaxed_rules,as_html = true){
    var output = '';
    if(relaxed_rules.length == 0){return '';}
    for(var r of relaxed_rules){output += `\n!!Rule[${r}] Relaxed!!\n(${this.r.desc[r]})`}
    if(as_html){return html(output,'relaxed');}
    else{return output;}
  }

  reject(){ // assumes correct challenge & reject is available
    var p = this.challenged
    this.c.add_rej(p)
    this.phase = 'c'; //change phase to request next challenge
    return this.stabilize();
  }

  accept(){
    this.c.acc = this.challenged;
    this.phase = 'f';
  }

  can_challenge(p){ // true if this prb can be challenged
    return this.c.available[this.active_rules[0]].includes(p);
  }

  challenge_conflicts(p){
    if(this.can_challenge(p)){return [];}
    if(!this.r.all_prbs.includes(p)){return ['o'];}
    var conflicts = [];
    for(var r of this.active_rules){
      if(this.c.constraints[r].includes(p)){conflicts.push(r);}
    }
    return conflicts;
  }

  challenge(p){ // assuming prb can be challenged
    this.challenged = p;
    this.phase = 'd';
  }

  can_reject(){return(this.c.nrej < this.r.mr);}

  execute_next(){ //execute next command in quotes[] (assumed that init happened)
    var cmd = this.quotes[this.cursor_idx].cmd;
    if(!this.check_cmd(cmd)){
      this.quotes[this.cursor_idx].resp="[ERROR] Invalid Command (See Tooltip)";
      this.quotes[this.cursor_idx].resp_typ='error';
    }
    else if(cmd=="x"){
      this.quotes[this.cursor_idx].resp = `Cache Cleared.\nNew Cache Saved at\n${this.cache_time}`;
      this.quotes[this.cursor_idx].resp_typ = 'cache'
    }
    else if(this.phase == "c"){
      var conflicts = this.challenge_conflicts(Number(cmd));
      if(conflicts.length == 0){
        this.challenge(Number(cmd));
        this.quotes[this.cursor_idx].resp = `#${cmd} Challenged`;
        this.quotes[this.cursor_idx].resp_typ = "challenge";
      }
      else{
        this.quotes[this.cursor_idx].resp = `Cannot Challenge!\n${this.read_conflicts(conflicts,false)}`;
        this.quotes[this.cursor_idx].resp_typ = 'conflict';
      }
    }
    else if(this.phase == "d"){
      cmd = cmd[0]; //process first letter only
      if(cmd == "a"){
        this.accept();
        this.quotes[this.cursor_idx].resp = `#${String(this.challenged)} Accepted`;
        this.quotes[this.cursor_idx].resp_typ = 'accept';
      }
      else if(cmd == "r"){
        if(this.can_reject()){
          var relaxed_rules = this.reject();
          this.quotes[this.cursor_idx].resp = `#${String(this.challenged)} Rejected`;
          this.quotes[this.cursor_idx].resp_typ = 'reject';
          // Logger.log(`297 [${relaxed_rules}]`);
          this.quotes[this.cursor_idx].resp += this.read_relaxed(relaxed_rules,true);
        }
        else{
          this.quotes[this.cursor_idx].resp = `Cannot Reject!! (Exceeded Maximum Rejects(${this.r.mr}))`;
          this.quotes[this.cursor_idx].resp_typ = 'conflict';          
        }
      }
    }
    else if(this.phase == "f"){
      // write command is not recorded, but done as a one-time run. (deleted at .add_command)
      if(cmd == "w"){
        if(this.write()){
          this.quotes[this.cursor_idx].resp  = `Writing to [PF${this.pf}-RM${this.rm}-ST${this.st}]`;
          this.quotes[this.cursor_idx].resp += `\n${html(`Rejected: ${this.c.rej}`,'reject')}`; 
          this.quotes[this.cursor_idx].resp += `\n${html(`Accepted: ${this.c.acc}`,'accept')}`; 

          this.quotes[this.cursor_idx].resp_typ = 'write';
        };
      }
      else{
        //(here should be impossible)
        this.quotes[this.cursor_idx].resp = `Challenge Completed. No actions possible.`;
        this.quotes[this.cursor_idx].resp_typ = 'warning';  
      }
    }
    else{Logger.log("ERROR!!!");}
    this.cursor_idx += 1;
    return this.cursor_idx;
  }

  execute_all(){
    // Logger.log(`[CB][${get_now(true)}] Excecution Started.`)
    this.execute_init();
    // Logger.log(`[CB][${get_now(true)}] Initialized.`)
    while(this.cursor_idx < this.quotes.length){
      // Logger.log(`[CB][${get_now(true)}] Processing Command #${this.cursor_idx}: ${this.quotes[this.cursor_idx].cmd}`)
      this.execute_next();
    }
    // Logger.log(`[CB][${get_now(true)}] Excecution Finished.`)
  }

  // HTML representation
  populate_table(){
    this.table["teams"] = [
      ["Rep.","Opp.","Rev."],
      [simplify_name(this.c.rep_team),simplify_name(this.c.opp_team),simplify_name(this.c.rev_team)]
    ]

    this.table["prbs"] = [["#"].concat(this.r.all_rules)];
    for(var p of this.r.all_prbs){
      var row = [String(p)];
      for(var r of this.r.all_rules){
        if(this.c.constraints[r].includes(p)){row.push(r);}
        else{row.push(" ");}
      }
      this.table["prbs"].push(row);
    }
  }

  html_quotes(){
    var output = '';
    for(var q of this.quotes){output += `${q.output_html()}<br>`}
    return output;
  }

  html_teams(){
    return html_table(this.table["teams"],null,true);
  }

  html_prbs(){
    //preprocess data with html tags.
    var a_raw  = copy_2d(this.table["prbs"]);
    var st_html = create_2d([a_raw.length,a_raw[0].length],'default'); //////////
    if(!this.c.select){ //don't do any styling if this is pre-selected stage
      for(var i_row = 0;i_row<a_raw.length;i_row++){
        if(this.can_challenge(Number(a_raw[i_row][0]))){
          st_html[i_row][0] = "challenge";
          // Logger.log(`${i_row} is available`);
        }
        for(var i_col = 1; i_col<a_raw[0].length ; i_col++){
          // Logger.log(a_raw[0][i_col])
          if(this.relaxed_rules.includes(a_raw[0][i_col])){
            st_html[i_row][i_col] = "relaxed";
          }
        }
      }
    }
    // Logger.log(string_2d(st_html));
    return html_table(a_raw,st_html,true);
  }

  html_summary(){
    var output_html = `New Rejects:${html(this.c.rej,'reject')}\n`;
    output_html    += `Total # of Rej.:${this.c.nrej}\n`;
    if(this.phase == "n"){
      output_html +=`${html("[NOT INITIAILIZED]",'status')}\n`
    }
    else if(this.phase == "c"){
      output_html +=`${html("[Waiting for Challenge]",'status')}\n`;
      output_html +=`[${html(this.c.available[this.active_rules[0]],'challenge')}]\n`
    }
    else if(this.phase == "d"){
      output_html +=`${html("[Waiting for (acc/rej)]",'status')}\n`;
      output_html +=`Currently Challenged:${html(this.challenged,'challenge')}\n`;
    }
    else if(this.phase == "f"){
      output_html +=`${html("[Challenge Complete]",'status')}\n`;
      output_html +=`Accepted Problem:${html(this.c.acc,'accept')}\n`;      
    }
    return str_to_html(output_html);
  }

  html_status(){ //combines teams/prbs/summary
    var output_html = '';
    this.populate_table();
    // Logger.log(multistring_2d([this.table["teams"],this.table["prbs"]]))
    // Logger.log("before:")
    // Logger.log(this.toString());
    output_html += this.html_teams();
    // Logger.log("after teams:")
    // Logger.log(this.toString());
    output_html += this.html_prbs();
    // Logger.log("after prbs:")
    // Logger.log(this.toString());
    // Logger.log(output_html);
    output_html += this.html_summary();
    // Logger.log("after summary:")
    // Logger.log(this.toString());
    // Logger.log(output_html);
    output_html += '<hr>';
    // Logger.log("As:")
    // Logger.log(output_html);
    return str_to_html(output_html);
  }

  html_tooltip(){
    var output_html = '';
    for(var cmd in this.cmd_spec){
      var spec = this.cmd_spec[cmd];
      if(spec[0].includes(this.phase)&&spec[1]!=null){
        output_html += `${html(`<b>${cmd}</b>: ${spec[1]}`,spec[2])}\n`;
      }
    }
    return str_to_html(output_html);
  }

  // writing to DATA sheet
  write(check_phase = true){
    if(check_phase && this.phase != 'f'){
      Logger.log("Did not write due to phase mismatch");
      return false;
    }
    Logger.log(`Writing Data to [PF${this.pf}-RM${this.rm}-ST${this.st}]`)
    return this.c.write();
  }

}



