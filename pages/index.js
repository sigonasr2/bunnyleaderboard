import axios from 'axios'
import { useEffect, useState } from 'react'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import ToggleButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/Button'
import useSWR from 'swr'
import Table from 'react-bootstrap/Table'

import 'bootstrap/dist/css/bootstrap.min.css';

const fetcher = url => axios.get(url).then(res => res.data)

var RABI_RIBI_GAME_ID = "o6g0o8d2"

function VariableSelector(p) {

  const {values} = p

  const displayValues = Object.keys(values.values.values).map((key)=>[values.values.values[key],key])
  const [selected,setSelected] = useState(Object.keys(values.values.values)[0])

  const handleChange=(e)=>{
    setSelected(e.target.id)
    var arr = {...p.selectionValues}
    arr[p.category.id][p.selectionID]=values.id+","+e.target.id
    p.setSelectionValues(arr)
  }

  return <>
    <ToggleButtonGroup type="radio" className="mb-2">
      {displayValues.map((value,i)=><ToggleButton key={i} variant={selected===value[1]?"primary":"outline-primary"} onClick={handleChange} id={value[1]}>{value[0].label}</ToggleButton>)}
    </ToggleButtonGroup><br/>
  </>
}

function getLeaderboard(categoryID,variables) {
  const { data,error } = useSWR("https://www.speedrun.com/api/v1/leaderboards/"+RABI_RIBI_GAME_ID+"/category/"+categoryID+variables,fetcher)

  return {
    data: data,
    isLoading: !error && !data,
    isError: error
  }
}

function Leaderboard(p) {
  const {data} = p
  return <Table striped bordered hover size="sm">
    <thead>
      <tr>
        <th>#</th>
        <th>Player</th>
        <th>Time without loads</th>
        <th>Time with loads</th>
        <th>Platform</th>
        <th>Version</th>
        <th>Date</th>
        <th>Video</th>
      </tr>
    </thead>
    <tbody>
    {data?.data.runs.map((run)=><tr key={run.run.id}>
      <td>{run.place}</td>{/*#*/}
      <td>{run.run.players[0].id??run.run.players[0]?.name}</td>{/*Player*/}
      <td>{run.run.times.realtime_noloads_t??""}</td>{/*Time without loads*/}
      <td>{run.run.times.realtime_t}</td>{/*Time with loads*/}
      <td>{run.run.system.platform}</td>{/*Platform*/}
      <td>{run.run.values.p85me3lg}</td>{/*Version*/}
      <td>{run.run.date}</td>{/*Date*/}
      <td>{run.run.videos?.links[0].uri}</td>{/*Video*/}
    </tr>)}
    </tbody>
  </Table>
}

export default function Home(p) {
  var {CATEGORIES,VARIABLES}= p

  const [selectedTab,setSelectedTab] = useState("")
  const [selectionValues,setSelectionValues] = useState({})
  const [appendStr,setAppendStr] = useState("")

  const {data} = getLeaderboard(selectedTab,appendStr)

  useEffect(()=>{
    var arr = {...p.selectionValues}
    CATEGORIES.forEach((cat,i)=>{
      if (i==0) {
        setSelectedTab(cat.id)
      }
      arr[cat.id]={}
      VARIABLES.filter((v)=>(v.category===cat.id||v.category===null)&&v["is-subcategory"]).forEach((v,i)=>{
        arr[cat.id][i]=(v.id+","+Object.keys(v.values.values)[0])
      })
    })
    setSelectionValues(arr)
  },[])

  useEffect(()=>{
    var appendStr = ""
    //console.log(selectionValues[selectedTab])
    for (var val in selectionValues[selectedTab]) {
      //console.log(selectionValues[selectedTab][val])
        var split = selectionValues[selectedTab][val].split(",")
      if (appendStr.length===0) {
        appendStr="?"
      } else {
        appendStr+="&"
      }
      appendStr+="var-"+split[0]+"="+split[1]
    }
    setAppendStr(appendStr)
  },[selectedTab,selectionValues])

  return <><Tabs className="mb-3" onSelect={(e)=>{setSelectedTab(e)}}>
    {CATEGORIES.map((cat)=><Tab key={cat.id} eventKey={cat.id} title={cat.name} id={cat.name}>
      {/*cat.rules*/}
      {VARIABLES.filter((v)=>(v.category===cat.id||v.category===null)&&v["is-subcategory"]).map((v,i)=><VariableSelector key={v.id} category={cat} selectionID={i} selectionValues={selectionValues} setSelectionValues={setSelectionValues} values={v}/>)}
    </Tab>)}
  </Tabs>
  {<Leaderboard data={data}/>}
  </>
}

export async function getStaticProps() {
  var CATEGORIES = {}
  var RUN_DATA = {}
  var VARIABLES = {}

  await axios.get("https://www.speedrun.com/api/v1/games/"+RABI_RIBI_GAME_ID+"/categories").then((data)=>{
    CATEGORIES = data.data.data
  })
  await axios.get("https://www.speedrun.com/api/v1/games/"+RABI_RIBI_GAME_ID+"/variables").then((data)=>{
    VARIABLES = data.data.data
  })

  return {
    props: {
      RUN_DATA,
      CATEGORIES,
      VARIABLES
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  }
}
