export default function StatCard({label,value,sub}:{label:string,value:any,sub?:string}){
  return <div className="card stat-card"><small>{label}</small><div className="money">{value}</div>{sub&&<p className="subtitle">{sub}</p>}</div>
}
