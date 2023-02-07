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

  is_pharsed(){return(this.pf.length != 1);}

  // lv: how many levels(down) to recurse (0: only my level)
  pharse(lv = 0){
    if(this.is_pharsed()){return}

    this.category = this.ss.getRange("META_CATEGORY").getValue();
    this.callname = this.ss.getRange("META_CALLNAME").getValue();

    this.len_pf = this.ss.getRange("SEED_PFS").getValue();
    this.len_rm = this.ss.getRange("SEED_RMS").getValue();

    this.draw = new Draw();
    this.draw.pharse();

    for(var i = 1;i<=this.len_pf;i++){this.pf.push(new Pf(i,this.len_rm))}

    if(lv){
      for(var idx = 1;idx<=this.len_pf;idx++){
        this.pf[idx].pharse(lv-1);
      }
    }
  }

  interpret(lv = 0){
    var output = this.toString();
    if(!this.is_pharsed()){return output};
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
    if(!this.is_pharsed()){return output+ '\t[UNPHARSED]';}
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

  is_pharsed(){return this.len_pf != null;}

  pharse(lv = 0){
    if(this.is_pharsed()){return;}
    this.len_pf = this.ss.getRange("SEED_PFS").getValue();
    this.len_rm = this.ss.getRange("SEED_RMS").getValue();
    this.num_teams = this.ss.getRange("DRAW_NUMTEAMS").getValue();

    this.draw_full   = slice_2d(this.ss.getRange("DRAW_FULL").getValues(),[0,0],[1+5*this.len_pf,2*this.len_rm]);
    this.draw_roster = slice_2d(this.ss.getRange("DRAW_ROSTER").getValues(),[0,0],[this.ss.getRange("DRAW_NUMTEAMS").getValue()-1,1]);
  }

  interpret(lv = 0){return this.toString();}

  toString(){
    var output = `\tDraw`
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
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

  is_pharsed(){return(this.len_rm != null);}

  pharse(lv = 0){
    if(this.is_pharsed()){return}

    this.len_rm = this.ss.getRange("SEED_RMS").getValue();

    for(var i = 1;i<=this.len_rm;i++){
      // Logger.log(`len:${len_st}`)
      this.rm.push(new Rm(this.pf_num,i))
    }

    if(lv){
      for(var idx = 1;idx<=this.len_rm;idx++){
        this.rm[idx].pharse(lv-1);
      }
    }
  }

  interpret(lv=0){
    var output = this.toString();
    if(!this.is_pharsed()){return output};
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
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
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

  is_pharsed(){return(this.st.length != 1);}

  pharse(lv = 0){
    if(this.is_pharsed()){return}
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
        this.st[idx].pharse(lv-1);
      }
    }
  }

  interpret(lv=0){
    var output = this.toString();
    if(!this.is_pharsed()){return output};
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
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
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

  is_pharsed(){return(this.raw != null)}

  pharse(lv = 0){
    this.raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`).getValues();
    // Logger.log(string_2d(this.raw,"RAW",0,true,6))

    this.challenge = new Challenge(this.pf_num,this.rm_num,this.st_num)
    this.challenge.pharse(0,this.raw);

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
    if(!this.is_pharsed()){return output};

    return output
  }

  toString(){ // 3 tabs
    var output = `\t\t\tSt [${this.pf_num}-${this.rm_num}-${this.st_num}]`
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
    // Logger.log([this.roster,this.summary["scr"],this.summary["fw"]])

    // output += `\n${string_2d(this.raw,"RAW",3,true,5)}`

    output += `\n${this.challenge.interpret(0)}`

    output += `\n${string_2d(this.result,"RESULT",3,true,6)}`

    return output
  }
  
}

// Class within Tournament defined for pharsing challenge information (used extensively in chatbot)
class Challenge{
  constructor(pf_num,rm_num,st_num){
    this.ss = get_ss_spreadsheet();
    this.pf_num = pf_num;
    this.rm_num = rm_num;
    this.st_num = st_num;
    
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

    // range variables (pharsed later at write.)
    this.rej_range = null;
    this.acc_range = null;
  }

  is_pharsed(){return this.penalty != null;}

  pharse(lv = 0,raw = undefined){
    if(raw == undefined){raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`).getValues();}

    this.rep_team = raw[2][2].toString();
    this.opp_team = raw[3][2].toString();
    this.rev_team = raw[4][2].toString();

    this.constraints["B"] = raw[7-1][4-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["P"] = raw[7-1][7-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["a"] = raw[7-1][10-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["b"] = raw[7-1][13-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["c"] = raw[7-1][16-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.constraints["d"] = raw[7-1][19-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);

    this.available["B"]   = raw[8-1][4-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["P"]   = raw[8-1][7-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["a"]   = raw[8-1][10-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["b"]   = raw[8-1][13-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["c"]   = raw[8-1][16-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.available["d"]   = raw[8-1][19-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);

    this.rej = raw[1-1].slice(6-1,16-1+1).map(str => Number(str)).filter(num => num != 0);
    this.acc = raw[1-1][18-1];

    this.select = this.ss.getRange("RULE_PRB_SEL").getValues()[0][this.pf_num-1];
    if(this.select){
      this.rej = [];
      this.acc = raw[6][0];
    }

    this.complete = Number(this.acc) != 0;

    this.nrej    = this.constraints["a"].length + this.rej.length
    this.weight  = raw[2][19];
    this.penalty = this.nrej > this.ss.getRange("RULE_SCR_AR").getValue();

  }

  interpret(lv = 0){return this.toString();}

  toString(){
    var output = `\t\t\tChallenge [${this.pf_num}-${this.rm_num}-${this.st_num}]`
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}

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

  add_rej(p){
    this.rej.push(p);
    this.nrej += 1;
    this.constraints['a'].push(p);
    remove_item(this.available['a'],p);
    remove_item(this.available['b'],p);
    remove_item(this.available['c'],p);
    remove_item(this.available['d'],p);
  }

  write(){ //write the current .rej & .acc values to the appropriate location.
    var raw_range  = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`);
    var sheet_data = raw_range.getSheet()
    this.rej_range = sheet_data.getRange(raw_range.getRow(),raw_range.getColumn()+5,1,11);
    this.acc_range = sheet_data.getRange(raw_range.getRow(),raw_range.getColumn()+17);
    
    this.rej_range.setValues(resize_2d([this.rej],[1,11],""));
    this.acc_range.setValue(this.acc);
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
  
  is_pharsed(){return this.current_pf != null;}

  pharse(){
    if(this.is_pharsed()){return;}
    this.current_pf = this.ss.getRange("BOARD_PF").getValue();
    this.content_num= this.ss.getRange("BOARD_CONTENT_NUM").getValues();
    this.content_rank=this.ss.getRange("BOARD_CONTENT_RANK").getValues();
  }

  interpret(){return this.toString();}

  toString(){
    var output = `Board`
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
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

  is_pharsed(){return this.content_prbs != null;}

  pharse(){
    if(this.is_pharsed()){return;}
    this.content_prbs  = this.ss.getRange("CORE_OUT_PRBS" ).getValues();
    this.content_names = this.ss.getRange("CORE_OUT_NAMES").getValues();
    this.content_teams = this.ss.getRange("CORE_OUT_TEAMS").getValues();
  }

  interpret(){return this.toString();}
  
  toString(){
    var output = `Core`
    if(!this.is_pharsed()){return output + "\t[UNPHARSED]"}
    output += `\n${multistring_2d([this.content_teams,this.content_prbs],undefined,0,false,6)}`
    output += `\n\n${multistring_2d([this.content_teams,this.content_names],undefined,0,false,5)}`
    return output  
  }
}

// Separate class defined for pharsing selection verdict ("SELECT") information
class Select{
  //TODO
}

// Separate class for pharsing rules of challenge (used in chatbot)
class Rule{
  constructor(){
    this.ss = get_ss_spreadsheet();
    this.mr = this.ss.getRange("RULE_PRB_MR").getValue(); //max.rejects
    this.ma = this.ss.getRange("RULE_PRB_MA").getValue(); //minimum available (below which rule relaxes)
    // this.ar = null;
    this.all_prbs = filter_empty(this.ss.getRange("META_PRB_SET").getValues()[0]);
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
  }
}










