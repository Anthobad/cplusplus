/** Explicit trusted-content validation, never invoked during student grading. One isolated VM. */
import { config } from 'dotenv';
import { Sandbox } from '@vercel/sandbox';
import { writeFile } from 'node:fs/promises';
import { ACTIVE_EXAMS,ACTIVE_POOLS } from '../server/data/activeExams';
import { compilerSnapshot } from '../server/sandbox/compilerSnapshot';
import { normalizeOutput } from '../src/lib/examGrading';
import { confirmHobbyProject } from './sandboxMaintenance';
config({path:'.env.local',quiet:true});await confirmHobbyProject();
const questions=[...Object.values(ACTIVE_POOLS).flat(),...ACTIVE_EXAMS.flatMap(e=>e.questions)];
const outputs=questions.filter(q=>q.type==='predict_output');
const blanks=questions.filter(q=>q.type==='fill_blank');
const programs=outputs.map(q=>({id:q.id,code:q.codeSnippet!,output:true}));
for(const q of blanks){
 let snippet=q.codeSnippet!.replace('/* blank 1 */',q.acceptedAnswers![0]);
 const prefix='#include <memory>\n#include <vector>\n#include <string>\n#include <unordered_map>\nstruct Resource {};\n';
 const body=q.id==='det-ef-ca-1'?`struct Owner { ${snippet} };\nint main(){}`:
   `int main(){ std::vector<int> values{0}; auto it=values.begin(); ${snippet} }`;
 programs.push({id:q.id,code:prefix+body,output:false});
}
const sandbox=await Sandbox.create({source:{type:'snapshot',snapshotId:compilerSnapshot.snapshotId},persistent:false,networkPolicy:'deny-all',resources:{vcpus:1},timeout:120000});
let record:any;
try{
 await sandbox.writeFiles([...programs.map((p,i)=>({path:`/vercel/content-${i}.cpp`,content:Buffer.from(p.code)})),
   {path:'/vercel/content-manifest.json',content:Buffer.from(JSON.stringify(programs.map((p,i)=>({id:p.id,index:i,output:p.output}))))}]);
 const script=`import subprocess,json
items=json.load(open('/vercel/content-manifest.json'))
records=[]
for item in items:
 p='/vercel/content-'+str(item['index'])
 compile=subprocess.run(['g++','-std=c++20','-Wall','-Wextra',p+'.cpp','-o',p],capture_output=True,text=True,timeout=15)
 if compile.returncode: raise RuntimeError(item['id']+': '+compile.stderr)
 output=''
 if item['output']:
  run=subprocess.run([p],capture_output=True,text=True,timeout=2)
  if run.returncode: raise RuntimeError(item['id']+': execution failed')
  output=run.stdout
 records.append(dict(id=item['id'],output=output))
print(json.dumps(dict(compiler=subprocess.check_output(['g++','--version'],text=True).splitlines()[0],records=records)))`;
 const result=await sandbox.runCommand({cmd:'python3',args:['-c',script],signal:AbortSignal.timeout(100000)});
 if(result.exitCode!==0)throw new Error(await result.stderr());
 const data=JSON.parse(await result.stdout());
 if(!/\b15\./.test(data.compiler))throw new Error('Expected GCC 15');
 for(const q of outputs){const row=data.records.find((r:any)=>r.id===q.id);
   if(!q.acceptedAnswers!.some(a=>normalizeOutput(a)===normalizeOutput(row.output)))throw new Error(`Incorrect authored output: ${q.id}`);}
 record={measuredAt:new Date().toISOString(),compiler:data.compiler,snapshotId:compilerSnapshot.snapshotId,
   outputPrograms:outputs.length,blankPrograms:blanks.length,allCompiled:true,allOutputsMatched:true};
}finally{await sandbox.stop();}
const stopped=await Sandbox.get({name:sandbox.name});
record.cleanup=stopped.status;if(record.cleanup!=='stopped')throw new Error('Content validation VM was not stopped');
await writeFile('docs/objective-content-validation.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
