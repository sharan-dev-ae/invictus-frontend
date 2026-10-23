import {useEffect,useMemo,useState} from 'react';
import {DndContext,DragEndEvent,KeyboardSensor,PointerSensor,useDraggable,useDroppable,useSensor,useSensors} from '@dnd-kit/core';
import {CheckCircle2,Clock3,Link2,Pause,Pencil,Play,Trash2} from 'lucide-react';

const statuses=['Pending','In Progress','On Hold','Completed'] as const;
type Status=typeof statuses[number];
type Entity={id:string;title:string;project_id?:string|null};
type Task={id:string;title:string;status:Status;completed?:boolean;project_id?:string|null;milestone_id?:string|null;estimated_minutes:number;accumulated_seconds:number;started_at?:string|null};

function Card({task,projects,milestones,now,onPatch,onEdit,onDelete}:{task:Task;projects:Entity[];milestones:Entity[];now:number;onPatch:(id:string,body:any)=>Promise<any>;onEdit:(task:Task)=>void;onDelete:(id:string)=>void}){
  const{attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:task.id,data:{status:task.status}});
  const seconds=task.accumulated_seconds+(task.started_at?Math.max(0,Math.floor((now-Date.parse(task.started_at))/1000)):0);
  const clock=`${Math.floor(seconds/3600)}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const context=milestones.find(x=>x.id===task.milestone_id)?.title||projects.find(x=>x.id===task.project_id)?.title||'Standalone task';
  return <article ref={setNodeRef} className={'taskCard '+(isDragging?'dragging':'')} style={{transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined}} {...listeners} {...attributes}>
    <span className="dragHandle" aria-hidden="true">⋮⋮</span>
    <div className="taskCardBody"><b className={task.status==='Completed'?'strike':''}>{task.title}</b><small><Link2/>{context}</small><div className="timeMeta"><span><Clock3/> {task.estimated_minutes}m</span><span className={task.status==='In Progress'?'running':''}>{clock}</span></div></div>
    <div className="taskActions">{task.status==='In Progress'?<button title="Hold" onClick={()=>onPatch(task.id,{status:'On Hold'})}><Pause/></button>:task.status!=='Completed'&&<button title={task.status==='On Hold'?'Resume':'Start'} onClick={()=>onPatch(task.id,{status:'In Progress'})}><Play/></button>} {task.status!=='Completed'&&<button title="Complete" onClick={()=>onPatch(task.id,{status:'Completed'})}><CheckCircle2/></button>}<button title="Edit" onClick={()=>onEdit(task)}><Pencil/></button><button className="deleteTask" title="Delete" onClick={()=>onDelete(task.id)}><Trash2/></button></div>
  </article>
}

function Column({status,tasks,...props}:{status:Status;tasks:Task[];projects:Entity[];milestones:Entity[];now:number;onPatch:(id:string,body:any)=>Promise<any>;onEdit:(task:Task)=>void;onDelete:(id:string)=>void}){
  const{setNodeRef,isOver}=useDroppable({id:status});
  return <section ref={setNodeRef} className={'taskColumn '+(isOver?'over':'')}><header><b>{status}</b><span>{tasks.length}</span></header><div className="taskColumnBody">{tasks.map(task=><Card key={task.id} task={task} {...props}/>) }{!tasks.length&&<p className="columnEmpty">Drop tasks here</p>}</div></section>
}

export default function TaskBoard({tasks,projects,milestones,onPatch,onEdit,onDelete}:{tasks:Task[];projects:Entity[];milestones:Entity[];onPatch:(id:string,body:any)=>Promise<any>;onEdit:(task:Task)=>void;onDelete:(id:string)=>void}){
  const[project,setProject]=useState(''),[milestone,setMilestone]=useState(''),[now,setNow]=useState(Date.now());
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor));
  const visible=useMemo(()=>tasks.filter(t=>(!project||t.project_id===project)&&(!milestone||t.milestone_id===milestone)),[tasks,project,milestone]);
  const availableMilestones=milestones.filter(m=>!project||m.project_id===project);
  const drop=({active,over}:DragEndEvent)=>{if(over&&active.data.current?.status!==over.id)onPatch(String(active.id),{status:String(over.id)});};
  return <><div className="taskBoardFilters"><label>Project<select value={project} onChange={e=>{setProject(e.target.value);setMilestone('')}}><option value="">All projects</option>{projects.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label>Milestone<select value={milestone} onChange={e=>setMilestone(e.target.value)}><option value="">All milestones</option>{availableMilestones.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><span>{visible.length} task{visible.length===1?'':'s'}</span></div><DndContext sensors={sensors} onDragEnd={drop}><div className="kanbanBoard">{statuses.map(status=><Column key={status} status={status} tasks={visible.filter(t=>t.status===status)} projects={projects} milestones={milestones} now={now} onPatch={onPatch} onEdit={onEdit} onDelete={onDelete}/>)}</div></DndContext></>
}
