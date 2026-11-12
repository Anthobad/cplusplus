/** JSON.parse silently accepts duplicate keys. Reject them before parsing/frozen-answer hashing. */
export function rejectDuplicateJsonKeys(raw:string) {
 const stack:{object:boolean;keys:Set<string>;keyExpected:boolean}[]=[];
 const tokens=raw.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g)||[];
 for(const token of tokens){
   const top=stack[stack.length-1];
   if(token==='{'||token==='['){stack.push({object:token==='{',keys:new Set(),keyExpected:token==='{'});continue;}
   if(token==='}'||token===']'){stack.pop();continue;}
   if(token===','){if(top?.object)top.keyExpected=true;continue;}
   if(token===':')continue;
   if(top?.object&&top.keyExpected&&token.startsWith('"')){
     const key=JSON.parse(token);if(top.keys.has(key))throw new Error('Duplicate JSON fields are not allowed.');
     top.keys.add(key);top.keyExpected=false;
   }
 }
}
