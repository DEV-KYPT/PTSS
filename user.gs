// wrapper for working with user information (credentials, access, etc.)

function user_get_id(){return Session.getActiveUser().getEmail().split("@")[0];}
function user_get_email(){return Session.getActiveUser().getEmail();}

function user_is_dev(){
  if(user_get_id() == ""){return false;}
  return get_prop_value('developers','s').split(";").includes(user_get_id());
}

class User{
  constructor(){
    this.id = user_get_id();
    this.email = user_get_email();

    this.cl = []; //given classes can be multiple
    this.credentials = {
      "INIT"    : false,
      "GEN"     : false,
      "STAFF"   : false,
      "DOC"     : false,
      "CHATBOT" : false,
      "UTIL"    : false,
    }
  }

  add_access(f){
    this.credentials[f] = true;
  }
  
}

// INIT
// GEN
// STAFF
// DOC
// CHATBOT
// UTIL