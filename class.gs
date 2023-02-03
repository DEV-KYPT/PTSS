// Object-based wrapper for pharsing all data

class Tournament { //lv0 (top)
  constructor(){
    this.ss     = get_ss_spreadsheet();
    this.len_pf = null;
    this.len_rm = null;
    
    this.category = null;
    this.callname = null;
    this.pf     = [null]
  }

  is_pharsed(){return(this.pf.length != 1);}

  // lv: how many levels(down) to recurse (0: only my level)
  pharse(lv = 0){
    if(this.is_pharsed()){return}

    this.category = this.ss.getRange("META_CATEGORY").getValue();
    this.callname = this.ss.getRange("META_CALLNAME").getValue();

    this.len_pf = this.ss.getRange("SEED_PFS").getValue();
    this.len_rm = this.ss.getRange("SEED_RMS").getValue();

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
    if(this.is_pharsed()){output+= `[${this.category}-${this.callname}]\t[PFS:${this.len_pf}] [RMS:${this.len_rm}]`}
    else{output += '\t[UNPHARSED]'}
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

    this.challenge = {
      "constraints":{
        "B":[],
        "P":[],
        "a":[],
        "b":[],
        "c":[],
        "d":[]
      },
      "rej":[],
      "acc":null,
      "nrej":[],
      "penalty":null,//true if weight penalty was inflicted.
      "weight":null  //calculated reporter weight
    }

    this.raw       = null;
    this.result    = null;
  }

  is_pharsed(){return(this.raw != null)}

  pharse(lv = 0){
    this.raw = this.ss.getRange(`DATA_P${this.pf_num}R${this.rm_num}_S${this.st_num}`).getValues()
    // Logger.log(string_2d(this.raw,"RAW",0,true,6))
    this.pharse_challenge();
    this.result = slice_2d(this.raw,[1,2],[4,21])
    for(var idx = 0;idx<this.result.length;idx++){this.result[idx].splice(16,3);}
    this.result[0][0] = `Team`;
    this.result[0][1] = 'Name';
    this.result[1][0] = `Rep.[${this.result[1][0]}]`;
    this.result[2][0] = `Opp.[${this.result[2][0]}]`;
    this.result[3][0] = `Rev.[${this.result[3][0]}]`;

  }

  pharse_challenge(){ // used the "-1" to help with compatibility with 0-index and 1-index
    this.challenge["constraints"]["B"] = this.raw[7-1][4-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.challenge["constraints"]["P"] = this.raw[7-1][7-1 ].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.challenge["constraints"]["a"] = this.raw[7-1][10-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.challenge["constraints"]["b"] = this.raw[7-1][13-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.challenge["constraints"]["c"] = this.raw[7-1][16-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);
    this.challenge["constraints"]["d"] = this.raw[7-1][19-1].toString().split(",").map(str => Number(str)).filter(num => num != 0);

    this.challenge["rej"] = this.raw[1-1].slice(6-1,16-1+1).map(str => Number(str)).filter(num => num != 0);
    this.challenge["acc"] = this.raw[1-1][18-1]

    this.challenge["nrej"]= this.challenge["constraints"]["a"].length + this.challenge["rej"].length
    this.challenge["weight"] = this.raw[2][19];
    this.challenge["penalty"] = this.challenge["nrej"] > this.ss.getRange("RULE_SCR_AR").getValue();
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
    output += `\n${string_2d(this.result,"RESULT",3,true,6)}`

    output += `\n\t\t\tChallenge:`
    output += `\n\t\t\t  Constraints: [B:${this.challenge["constraints"]["B"]}], [P:${this.challenge["constraints"]["P"]}], [a:${this.challenge["constraints"]["a"]}], [b:${this.challenge["constraints"]["b"]}], [c:${this.challenge["constraints"]["c"]}], [d:${this.challenge["constraints"]["d"]}]`
    output += `\n\t\t\t  Rejected:[${this.challenge["rej"]}] (total of ${this.challenge["nrej"]}), penalty:${this.challenge["penalty"]} (weight: ${this.challenge["weight"]})`
    output += `\n\t\t\t  Accepted: ${this.challenge["acc"]}`
    return output
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

// Separate class defined for pharsing draw ("DRAW") information
class Draw{
  //TODO
}

// Separate class defined for pharsing selection verdict ("SELECT") information
class Select{
  //TODO
}