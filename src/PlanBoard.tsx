import {DndContext,DragEndEvent,KeyboardSensor,PointerSensor,useDraggable,useDroppable,useSensor,useSensors} from '@dnd-kit/core';

const statuses=['Pending','On Hold','In Progress','Completed'] as const;
type Status=typeof statuses[number];
type Plan={id:string;title:string;description:string;status:Status;priority:string;category:string;due_date?:string;progress:number};

function PlanCard({plan}:{plan:Plan}){
  const{attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:plan.id,data:{status:plan.status}});
  return <article ref={setNodeRef} className={'plan draggablePlan '+(isDragging?'dragging':'')} style={{transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined}} {...listeners} {...attributes}><span className="planDrag" aria-hidden="true">⋮⋮</span><div><span className={'priority '+plan.priority.toLowerCase()}>{plan.priority}</span><small>{plan.category}</small></div><h3>{plan.title}</h3><p>{plan.description}</p><div className="bar"><i style={{width:plan.progress+'%'}}/></div><footer><span>{plan.progress}%</span><span>{plan.due_date||'No deadline'}</span></footer></article>
}

function Column({status,plans}:{status:Status;plans:Plan[]}){
  const{setNodeRef,isOver}=useDroppable({id:status});
  return <section ref={setNodeRef} className={isOver?'over':''}><header><b>{status}</b><span>{plans.length}</span></header>{plans.map(plan=><PlanCard key={plan.id} plan={plan}/>)}{!plans.length&&<p className="planDropEmpty">Drop plans here</p>}</section>
}

export default function PlanBoard({plans,onPatch}:{plans:Plan[];onPatch:(id:string,changes:any)=>Promise<any>}){
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor));
  const drop=({active,over}:DragEndEvent)=>{if(over&&active.data.current?.status!==over.id)onPatch(String(active.id),{status:String(over.id)});};
  return <DndContext sensors={sensors} onDragEnd={drop}><div className="board">{statuses.map(status=><Column key={status} status={status} plans={plans.filter(plan=>plan.status===status)}/>)}</div></DndContext>
}
