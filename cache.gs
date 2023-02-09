// this script only wrapps script cache for simplicity and speed.

function cache_set(key,obj){CacheService.getScriptCache().put(key,JSON.stringify(obj));}

function cache_get(key){return JSON.parse(CacheService.getScriptCache().get(key));}

function cache_delete(key  = 'chat_p1r2s3'){
  var v = CacheService.getScriptCache().get(key);
  CacheService.getScriptCache().remove(key);
  Logger.log(`Removed ${key} [>] ${v}`)
}

function cache_read(key = 'chat_p1r2s3'){
  var v = CacheService.getScriptCache().get(key);
  Logger.log(`Cache: ${key} [>] ${v}`)
}