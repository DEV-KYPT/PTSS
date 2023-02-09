// Object-based wrapper for pharsing all data

class Tournament { //lv0 (top)
  constructor(){
    this.ss     = get_ss_spreadsheet();
    this.len_pf = null;
    this.len_rm = null;
    
    this.category = null;
    this.callname = null;

    this.draw   = null;
    this.pf     = [null];
  }

  is_parsed(){return(this.pf.length != 1);}

  // lv: how many levels(down) to recurse (0: only my level)
  parse(lv = 0){
    if(this.is_parsed()){return}

    this.category = this.ss.getRange("META_CATEGORY").getValue();
    this.callname = this.ss.getRange("META_CALLNAME").getValue();

    this.len_pf = this.ss.getRange("SEED_PFS").getValue();
    this.len_rm = this.ss.getRange("SEED_RMS").getValue();

    this.draw = new Draw();
    this.draw.parse();

    for(var i = 1;i<=this.len_pf;i++){this.pf.push(new Pf(i,this.len_rm))}

    if(lv){
      for(var idx = 1;idx<=this.len_pf;idx++){
        this.pf[idx].parse(lv-1);
      }
    }
  }

  interpret(lv = 0){
    var output = this.toString();
    if(!this.is_parsed()){return output};
    if(lv){
      output+= '\nPFs:['
      for(var idx = 1;idx<=this.len_pf;idx++){
        output += `\n${this.pf[idx].interpret(lv-1)}`
      }
      output+= '\n]'
    }
    return output
  }

  toString(){
    var output = `Tournament Instance  `;
    if(!this.is_parsed()){return output+ '\t[UNparseD]';}
    output+= `[${this.category}-${this.callname}]\t[PFS:${this.len_pf}] [RMS:${this.len_rm}]`
    output += `\n${this.draw.interpret(0)}`;
    return output
  }
}

// Class within Tournament defined for pharsing draw ("DRAW") information
class Draw{
  constructor(){
    this.ss = get_ss_spreadsheet();

    this.len_pf = null;
    this.len_rm = null;
    this.num_teams = null;

    this.draw_full = null;
    this.draw_roster = null;
  }

  is_parsed(){return this.len_pf != null;}

  parse(lv = 0){
    if(this.is_parsed()){return;}
    this.len_pf = this.ss.getRange("SEED_PFS").getValue();
    this.len_rm = this.ss.getRange("SEED_RMS").getValue();
    this.num_teams = this.ss.getRange("DRAW_NUMTEAMS").getValue();

    this.draw_full   = slice_2d(this.ss.getRange("DRAW_FULL").getValues(),[0,0],[1+5*this.len_pf,2*this.len_rm]);
    this.draw_roster = slice_2d(this.ss.getRange("DRAW_ROSTER").getValues(),[0,0],[this.ss.getRange("DRAW_NUMTEAMS").getValue()-1,1]);
  }

  interpret(lv = 0){return this.toString();}

  toString(){
    var output = `\tDraw`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    output += `\t[${this.num_teams} TEAMS]\n`
    output += multistring_2d([this.draw_full,this.draw_roster],["FULL DRAW","RST"],1,true)
    return output    
  }

}

class Pf { //lv1
  constructor(pf_num){
    this.ss     = get_ss_spreadsheet();
    this.pf_num = pf_num;
    // this.len_rm = len_rm;

    this.len_rm = null;    
    this.rm = [null]
  }

  is_parsed(){return(this.len_rm != null);}

  parse(lv = 0){
    if(this.is_parsed()){return}

    this.len_rm = this.ss.getRange("SEED_RMS").getValue();

    for(var i = 1;i<=this.len_rm;i++){
      // Logger.log(`len:${len_st}`)
      this.rm.push(new Rm(this.pf_num,i))
    }

    if(lv){
      for(var idx = 1;idx<=this.len_rm;idx++){
        this.rm[idx].parse(lv-1);
      }
    }
  }

  interpret(lv=0){
    var output = this.toString();
    if(!this.is_parsed()){return output};
    if(lv){
      output+= '\n\tRooms:['
      for(var idx = 1;idx<=this.len_rm;idx++){
        output += `\n${this.rm[idx].interpret(lv-1)}`
      }
      output+= '\n\t]'
    }
    return output
  }

  toString(){
    var output = `\tPf [${this.pf_num}]`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    output += `\t[RMS:${this.len_rm}]`
    return output
  }

}

class Rm {
  constructor(pf_num,rm_num){
    this.ss     = get_ss_spreadsheet();
    this.pf_num = pf_num;
    this.rm_num = rm_num;

    this.rm_loc;
    this.len_st = null;
    this.roster = null;
    this.summary= {"scr":null,"fw":null}
    this.tk     = null; //timkeeper
    this.sk     = null; //scorekeeper

    this.st = [null]
  }

  is_parsed(){return(this.st.length != 1);}

  parse(lv = 0){
    if(this.is_parsed()){return}
    this.rm_loc = this.ss.getRange(`DRAW_RM${this.rm_num}`).getValue();
    this.len_st = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_LEN`).getValue();

    var summary_raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_SUMMARY`).getValues();
    this.roster = slice_2d(summary_raw,[0,0],[3,1]);

    this.summary["scr"] = slice_2d(summary_raw,[0,19],[3,19]);
    this.summary["fw"]  = slice_2d(summary_raw,[0,20],[3,20]);

    this.tk = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_TK`).getValue();
    this.sk = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_SK`).getValue();


    for(var i = 1;i<=this.len_st;i++){
      this.st.push(new St(this.pf_num,this.rm_num,i))
    }

    if(lv){
      for(var idx = 1;idx<=this.len_st;idx++){
        this.st[idx].parse(lv-1);
      }
    }
  }

  interpret(lv=0){
    var output = this.toString();
    if(!this.is_parsed()){return output};
    if(lv){
      output+= '\n\t\tStages:['
      for(var idx = 1;idx<=this.len_st;idx++){
        output += `\n${this.st[idx].interpret(lv-1)}`
      }
      output+= '\n\t\t]'
    }

    return output
  }

  toString(){
    var output = `\t\tRm [${this.pf_num}-${this.rm_num}]`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    output += `\t[STs:${this.len_st}]\t[TK:${this.tk},SK:${this.sk}]`
    // Logger.log([this.roster,this.summary["scr"],this.summary["fw"]])
    output += `\n${multistring_2d([this.roster,this.summary["scr"],this.summary["fw"]],["ROSTER","SCORE","FW"],2,false,8)}`
    return output
  }

}

class St {
  constructor(pf_num,rm_num,st_num){
    this.ss = get_ss_spreadsheet();
    this.pf_num = pf_num;
    this.rm_num = rm_num;
    this.st_num = st_num;

    this.raw       = null;

    this.challenge = null;
    this.result    = null;
  }

  is_parsed(){return(this.raw != null)}

  parse(lv = 0){
    this.raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`).getValues();
    // Logger.log(string_2d(this.raw,"RAW",0,true,6))

    this.challenge = new Challenge(this.pf_num,this.rm_num,this.st_num)
    this.challenge.parse(0,this.raw);

    this.result = slice_2d(this.raw,[1,2],[4,21])
    for(var idx = 0;idx<this.result.length;idx++){this.result[idx].splice(16,3);}
    this.result[0][0] = `Team`;
    this.result[0][1] = 'Name';
    this.result[1][0] = `Rep.[${this.result[1][0]}]`;
    this.result[2][0] = `Opp.[${this.result[2][0]}]`;
    this.result[3][0] = `Rev.[${this.result[3][0]}]`;

  }

  interpret(lv=0){ // bottom level, no interpretation required
    var output = this.toString();
    if(!this.is_parsed()){return output};

    return output
  }

  toString(){ // 3 tabs
    var output = `\t\t\tSt [${this.pf_num}-${this.rm_num}-${this.st_num}]`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    // Logger.log([this.roster,this.summary["scr"],this.summary["fw"]])

    // output += `\n${string_2d(this.raw,"RAW",3,true,5)}`

    output += `\n${this.challenge.interpret(0)}`

    output += `\n${string_2d(this.result,"RESULT",3,true,6)}`

    return output
  }
  
}

// Class within Tournament defined for pharsing challenge information (used extensively in chatbot)
class Challenge{
  constructor(pf_num,rm_num,st_num,cache_obj = null,verbose = false){
    if(verbose){Logger.log("[CHALLENGE-INIT] Started");}
    this.start_ms = get_milisec();

    this.ss = get_ss_spreadsheet();
    this.pf_num = pf_num;
    this.rm_num = rm_num;
    this.st_num = st_num;
    
    this.raw = null;

    this.rep_team = null;
    this.opp_team = null;
    this.rev_team = null;

    this.complete = null; // true if this challenge is complete
    this.select   = null; // true if this challenge is pre-selected

    this.constraints = { //problems blocked by each rule
      "B":[],
      "P":[],
      "a":[],
      "b":[],
      "c":[],
      "d":[]
    }
    this.available = { //problems not blocked by given rule and above
      "B":[],
      "P":[],
      "a":[],
      "b":[],
      "c":[],
      "d":[]        
    },
    
    this.rej    = [];
    this.acc    = null;


    this.nrej   = null;
    this.penalty= null;  //true if weight penalty was inflicted.
    this.weight = null;  //calculated reporter weight

    // range variables (used for write.)
    this.rej_range = null;
    this.acc_range = null;

    if(cache_obj != null){
      if(verbose){Logger.log("[CHALLENGE-INIT] Cache detected!")}
      this.raw = cache_obj.raw;
      this.select = cache_obj.select;
      this.penalty = cache_obj.penalty;
    }

    // separate indicator required (due to cache)
    this.parsed = false;
  }

  is_parsed(){return this.parsed;}

  parse(lv = 0,raw = undefined,verbose = false){
    if(this.raw == null){ // use getRange / getValues if failed to get this.raw from cache.
      this.raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`).getValues();
    }
    this.rep_team = this.raw[2][2].toString();
    this.opp_team = this.raw[3][2].toString();
    this.rev_team = this.raw[4][2].toString();

    this.constraints["B"] = this.raw[7-1][4-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["P"] = this.raw[7-1][7-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["a"] = this.raw[7-1][10-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["b"] = this.raw[7-1][13-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["c"] = this.raw[7-1][16-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["d"] = this.raw[7-1][19-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);

    this.available["B"]   = this.raw[8-1][4-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["P"]   = this.raw[8-1][7-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["a"]   = this.raw[8-1][10-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["b"]   = this.raw[8-1][13-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["c"]   = this.raw[8-1][16-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["d"]   = this.raw[8-1][19-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);

    this.rej = this.raw[1-1].slice(6-1,16-1+1).map(str => Number(str)).filter(num => num != 0);
    this.acc = this.raw[1-1][18-1];

    if(this.select == null){
      this.select = this.ss.getRange("RULE_PRB_SEL").getValues()[0][this.pf_num-1];
    }

    if(this.select){
      this.rej = [];
      this.acc = this.raw[6][0];
    }


    this.complete = Number(this.acc) != 0;

    this.nrej    = this.constraints["a"].length + this.rej.length
    this.weight  = this.raw[2][19];

    if(this.penalty ==  null){
      this.penalty = this.nrej > this.ss.getRange("RULE_SCR_AR").getValue();
    }
    this.parsed = true;
    if(verbose){Logger.log(`[CHALLENGE-PHARSE] Elapsed time: ${get_milisec() - this.start_ms}ms`)}
  }

  interpret(lv = 0){return this.toString();}

  toString(){
    var output = `\t\t\tChallenge [${this.pf_num}-${this.rm_num}-${this.st_num}]`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}

    if(this.complete){output += ' <COMPLETE>';}
    else             {output += ' <INCOMPLETE>';}

    if(this.select){output += ' (PRE-SELECTED)';}

    output += `\n\t\t\t REP: ${this.rep_team} | OPP: ${this.opp_team} | REV: ${this.rev_team}`

    output += '\n';
    var a_constraints = [
      [`[B:${this.constraints["B"]}]`],
      [`[P:${this.constraints["P"]}]`],
      [`[a:${this.constraints["a"]}]`],
      [`[b:${this.constraints["b"]}]`],
      [`[c:${this.constraints["c"]}]`],
      [`[d:${this.constraints["d"]}]`]
    ];

    var a_available = [
      [`[B:${this.available["B"]}]`],
      [`[P:${this.available["P"]}]`],
      [`[a:${this.available["a"]}]`],
      [`[b:${this.available["b"]}]`],
      [`[c:${this.available["c"]}]`],
      [`[d:${this.available["d"]}]`]
    ];

    output += multistring_2d([a_constraints,a_available],["CONSTRAINTS","AVAILABLE"],3,false)

    output += `\t\t\t  Rejected:[${this.rej}] (total of ${this.nrej}), penalty:${this.penalty} (weight: ${this.weight})`
    output += `\n\t\t\t  Accepted: ${this.acc}`

    return output
  }

  toJSON(){
    if(!this.is_parsed()){return null}
    return {
      raw : this.raw,
      select : this.select,
      penalty : this.penalty,
    }
  }

  //additonal pure function / output methods for chatbot use

  ignore_written_results(){// ignores the user input values (new rejects, accept)
    var done = false;
    if(this.select){return false;} //do not ignore if this stage is pre-selected.
    if(this.rej.length != 0 || this.complete){done = true;}
    for(var p of this.rej){
      // this.constraints['a'] = remove_item(this.constraints['a'],p);
      for(var r of ['a','b','c','d']){
        if(this.constraints[r].includes(p)){break;}
        this.available[r].push(p);
      }
    }
    this.nrej -= this.rej.length;
    this.rej = [];
    this.acc = '';
    this.complete = false;
    return done;
  }

  highlight(){
    var st_range = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`);
    var sheet_data = st_range.getSheet();
    sheet_data.getRange(sheet_data.getMaxRows(),sheet_data.getMaxColumns()).activate() // activate bottom right cell
    st_range.activate();
  }

  add_rej(p){
    this.rej.push(p);
    this.nrej += 1;
    this.constraints['a'].push(p);
    remove_item(this.available['a'],p);
    remove_item(this.available['b'],p);
    remove_item(this.available['c'],p);
    remove_item(this.available['d'],p);
  }

  write(with_cb = true){ //write the current .rej & .acc values to the appropriate location.  
    var raw_range  = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`);
    var sheet_data = raw_range.getSheet()
    this.rej_range = sheet_data.getRange(raw_range.getRow(),raw_range.getColumn()+5,1,11);
    this.acc_range = sheet_data.getRange(raw_range.getRow(),raw_range.getColumn()+17);

    this.rej_range.setValues(resize_2d([this.rej],[1,11],""));
    this.acc_range.setValue(this.acc);

    if(with_cb){sheet_data.getRange(raw_range.getRow()+7,raw_range.getColumn()-1).setValue('C')}
    return true;
  }

}

// Separate class defined for pharsing leaderboard ("BOARD") information
class Board{
  constructor(){
    this.ss = get_ss_spreadsheet();
    this.content_num = null;
    this.content_rank= null;
    this.current_pf = null;
  }
  
  is_parsed(){return this.current_pf != null;}

  parse(){
    if(this.is_parsed()){return;}
    this.current_pf = this.ss.getRange("BOARD_PF").getValue();
    this.content_num= this.ss.getRange("BOARD_CONTENT_NUM").getValues();
    this.content_rank=this.ss.getRange("BOARD_CONTENT_RANK").getValues();
  }

  interpret(){return this.toString();}

  toString(){
    var output = `Board`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    // Logger.log([this.roster,this.summary["scr"],this.summary["fw"]])
    output += `\t[~ PF${this.current_pf}]`
    output += `\n${multistring_2d([this.content_num,this.content_rank],["BY NUMBER","BY RANK"],0,true,6)}`
    return output    
  }
}

class Core{
  constructor(){
    this.ss = get_ss_spreadsheet();
    this.content_prbs = null;
    this.content_names = null;
    this.content_teams = null;
  }

  is_parsed(){return this.content_prbs != null;}

  parse(lv = 0){
    if(this.is_parsed()){return;}
    this.content_prbs  = this.ss.getRange("CORE_OUT_PRBS" ).getValues();
    this.content_names = this.ss.getRange("CORE_OUT_NAMES").getValues();
    this.content_teams = this.ss.getRange("CORE_OUT_TEAMS").getValues();
  }

  interpret(lv = 0){return this.toString();}
  
  toString(){
    var output = `Core`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}
    output += `\n${multistring_2d([this.content_teams,this.content_prbs],undefined,0,false,6)}`
    output += `\n\n${multistring_2d([this.content_teams,this.content_names],undefined,0,false,5)}`
    return output  
  }
}

// Separate class defined for pharsing selection verdict ("SELECT") information
class Select{
  constructor(){
    this.ss = get_ss_spreadsheet();
    this.sel_pf_nums = [];
    this.roster = null;
    this.verdicts = {};
  }

  is_parsed(){return this.roster != null;}

  parse(lv = 0){
    if(this.is_parsed()){return;}
    var sel_raw   = [null].concat(this.ss.getRange("RULE_PRB_SEL" ).getValues()[0]); //used null as first element for 1-indexing
    for(var pf_num = 1;pf_num < sel_raw.length; pf_num ++){
      if(sel_raw[pf_num] == true){this.sel_pf_nums.push(pf_num);}
    }
    this.roster        = this.ss.getRange("DRAW_ROSTER").getValues();

    for(var pf_num of this.sel_pf_nums){
      this.verdicts[pf_num] = this.ss.getRange(`SELECT_VERDICT_P${pf_num}`).getValues();
    }
    // Logger.log(this.sel_pf_nums)

  }

  interpret(lv = 0){return this.toString();}
  
  toString(){
    var output = `Select`
    if(!this.is_parsed()){return output + "\t[UNparseD]"}

    var a_outputs = [this.roster];

    for(var pf_num of this.sel_pf_nums){a_outputs.push(this.verdicts[pf_num])}

    output += `\n${multistring_2d(a_outputs,["ROSTER"].concat(this.sel_pf_nums.map(e => `P${e}`)),0,false,6)}`
    return output  
  }

}

// Separate class defined for pharsing Final round
class Final{
  //TODO
}

// Separate class for pharsing rules of challenge (used in chatbot)
class Rule{
  constructor(cache_obj = null,verbose = false){
    if(verbose){Logger.log("[RULE-INIT] Started");}
    var ms = get_milisec();
    this.ss = get_ss_spreadsheet();

    if(cache_obj != null){
      if(verbose){Logger.log("[RULE-INIT] Cache detected!")}
      this.cache_time = cache_obj.cache_time;
      this.mr = cache_obj.mr;
      this.ma = cache_obj.ma;
      this.all_prbs = cache_obj.all_prbs
    }
    else{
      this.cache_time = get_now(true);
      this.mr = this.ss.getRange("RULE_PRB_MR").getValue(); //max.rejects
      this.ma = this.ss.getRange("RULE_PRB_MA").getValue(); //minimum available (below which rule relaxes)
      this.all_prbs = filter_empty(this.ss.getRange("META_PRB_SET").getValues()[0]);
    }
    // this.ar = null;
    this.all_rules = ["B","P",'a','b','c','d'];
    this.desc  = {
      'B':"Banned in KYPT",
      'P':"Presented in this PF",
      'a':"Rejected by Reporter",
      'b':"Presented by Reporter",
      'c':"Opposed by Opponent",
      'd':"Presented by Opponent",
      'o':"Out of Range",
    }
    if(verbose){Logger.log(`[RULE-INIT] Elapsed time: ${get_milisec()-ms}ms`)}
  }
  
  toJSON(){
    return {
      cache_time : this.cache_time,
      mr : this.mr,
      ma : this.ss,
      all_prbs : this.all_prbs
    }
  }

  cache_test(){
    Logger.log(`Recovered from Cache Successfully as Rule Instance. (Cached ${this.cache_time}),Retrieved ${get_now(true)}`)
  }
}

function cache_test_upload(){
  var r = new Rule();
  cache_set("test",r);
}

function cache_test_clear(){
  CacheService.getScriptCache().put("test",null);
}

function cache_test_download(){
  var start = get_milisec();
  var o = cache_get("test")
  if(o != null){Logger.log("Cache deetected!")}
  var r_recovered = new Rule(o);
  var end = get_milisec();
  r_recovered.cache_test();
  Logger.log(`Elapsed time: ${end - start}ms`)
}








