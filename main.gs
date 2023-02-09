function main(){
  /////////////////////////////////////////////////////////////
  // var t = new Tournament();
  // Logger.log(t.toString());
  // t.parse(0)
  // Logger.log(t.interpret(0))

  // var d = new Draw();
  // Logger.log(""+d);
  // d.parse()
  // Logger.log(""+d)

  /////////////////////////////////////////////////////////////
  // var p = new Pf(3,6)
  // p.parse(3)
  // Logger.log(p.interpret(2))

  /////////////////////////////////////////////////////////////
  // var r = new Rm(4,8)
  // r.parse(1)
  // Logger.log(r.interpret(2))
  // Logger.log(string_2d(r.st[1].raw,"XXXX",0,true,6))

  /////////////////////////////////////////////////////////////
  // var s = new St(5,5,3)
  // s.parse()
  // Logger.log(""+s)

  // var c = new Challenge(6,1,4);
  // c.parse();
  // Logger.log(""+c)
  // Logger.log(c.select)
  /////////////////////////////////////////////////////////////
  // var b = new Board()
  // b.parse()
  // Logger.log(""+b)

  /////////////////////////////////////////////////////////////
  // var array1 = [
  //   ["0-0",'0-1','0-2','0-3'],
  //   ["1-0",'1-1','1-2','1-3'],
  //   ["2-0",'2-1','2-2','2-3'],
  //   ["3-0",'3-1','3-2','3-3'],
  // ]
  // var array2 = [
  //   ['0-0A2','0-1A2','0-2A2','0-3A2','0-4A2'],
  //   ['1-0A2','1-1A2','1-2A2','1-3A2','1-4A2'],
  //   ['2-0A2','2-1A2','2-2A2','2-3A2','2-4A2'],
  //   ['3-0A2','3-1A2','3-2A2','3-3A2','3-4A2'],
  //   ['4-0A2','4-1A2','4-2A2','4-3A2','4-4A2'],
  // ]
  // Logger.log(string_2d(slice_2d(array2,[0,1],[3,4]),"ARR",1,true,4))
  // Logger.log(multistring_2d([array1,array2],['A','B'],3,true,2))

  /////////////////////////////////////////////////////////////
  // var c = new Core();
  // c.parse();
  // Logger.log(""+c);

  /////////////////////////////////////////////////////////////
  // var sel = new Select();
  // sel.parse();
  // Logger.log(""+sel)

  /////////////////////////////////////////////////////////////
  // var conv = new Chat(1,2,3);
  // conv.add_cmd('c')
  // Logger.log(''+conv);

  // Logger.log(`[main]${get_now(true)} before getRange`);
  // var range = get_ss_spreadsheet().getRange("DATA_P1R1_S1")
  // Logger.log(`[main]${get_now(true)} after getRange`);
  // var values = range.getValues();
  // Logger.log(`[main]${get_now(true)} after getValues`);

  var start = new Date();
  var startTime = Number(start.getTime()).toFixed(0);
  Logger.log(Number(start.getTime()).toFixed(0));
  Utilities.sleep(1000)
  var end = new Date();
  Logger.log(Number(end.getTime()).toFixed(0))
  var s = JSON.stringify(end)
  Logger.log(s)
  var end_s = JSON.parse(s)
  Logger.log(typeof(end_s))
  Logger.log(Number(end.getTime()).toFixed(0))

}









