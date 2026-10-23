import {useState,type FormEvent} from 'react';
import {FolderKanban,Milestone,Plus,Save,Sparkles,WandSparkles,X} from 'lucide-react';

type Entity={id:string;title:string;project_id?:string|null};
type Kind='task'|'project'|'milestone'|'ai';

export default function WorkspaceCreate({projects,milestones,onPost,onGenerate}:{projects:Entity[];milestones:Entity[];onPost:(path:string,body:any)=>Promise<any>;onGenerate:(body:any)=>Promise<any>}){
  const[open,setOpen]=useState(false),[kind,setKind]=useState<Kind>('task'),[busy,setBusy]=useState(false);
  const[title,setTitle]=useState(''),[project,setProject]=useState(''),[milestone,setMilestone]=useState(''),[estimate,setEstimate]=useState(30),[prompt,setPrompt]=useState('');
  const close=()=>{setOpen(false);setTitle('');setPrompt('')};
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{
    if(kind==='task')await onPost('/tasks',{title,estimated_minutes:estimate,project_id:project||null,milestone_id:milestone||null});
    if(kind==='project')await onPost('/projects',{title,description:''});
    if(kind==='milestone')await onPost('/milestones',{title,project_id:project||null});
    if(kind==='ai')await onGenerate({prompt,project_id:project||null,milestone_id:milestone||null});
    close();
  }finally{setBusy(false)}};
  const available=milestones.filter(x=>!project||x.project_id===project);
  return <><div className="workspaceToolbar"><div><span>WORKSPACE</span><b>Your execution board</b><small>Create when needed, then keep your attention on moving work forward.</small></div><button className="secondary aiCreate" onClick={()=>{setKind('ai');setOpen(true)}}><WandSparkles/>Plan with AI</button><button className="primary" onClick={()=>{setKind('task');setOpen(true)}}><Plus/>Create</button></div>{open&&<div className="modalBack" onClick={close}><form className="editModal createModal" onClick={e=>e.stopPropagation()} onSubmit={submit}><header><div><small>NEW ITEM</small><h2>Create in Invictus</h2></div><button type="button" onClick={close}><X/></button></header><div className="createTabs"><button type="button" className={kind==='task'?'active':''} onClick={()=>setKind('task')}><Save/>Task</button><button type="button" className={kind==='project'?'active':''} onClick={()=>setKind('project')}><FolderKanban/>Project</button><button type="button" className={kind==='milestone'?'active':''} onClick={()=>setKind('milestone')}><Milestone/>Milestone</button><button type="button" className={kind==='ai'?'active':''} onClick={()=>setKind('ai')}><Sparkles/>AI plan</button></div>{kind==='ai'?<label>Describe what you want to accomplish<textarea required value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prepare for a product launch, including the landing page, analytics, and announcement."/></label>:<label>{kind==='task'?'Task':kind==='project'?'Project':'Milestone'} name<input required autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder={`Name your ${kind}`}/></label>}{kind==='task'&&<label>Estimated completion time<input type="number" min="1" value={estimate} onChange={e=>setEstimate(Number(e.target.value))}/><small>Minutes</small></label>}{(kind==='task'||kind==='milestone'||kind==='ai')&&<label>Project<select value={project} onChange={e=>{setProject(e.target.value);setMilestone('')}}><option value="">No project</option>{projects.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>}{(kind==='task'||kind==='ai')&&<label>Milestone<select value={milestone} onChange={e=>setMilestone(e.target.value)}><option value="">No milestone</option>{available.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>}<button className="primary" disabled={busy}><Plus/>{busy?'Creating…':kind==='ai'?'Create structure':`Create ${kind}`}</button></form></div>}</>
}
