import axios from 'axios'
import { useEffect, useState } from 'react'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import ToggleButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/Button'
import useSWR from 'swr'
import Table from 'react-bootstrap/Table'
import Spinner from 'react-bootstrap/Spinner'
import {CameraReelsFill} from 'react-bootstrap-icons'
import Gradient from 'rgt'
import Container from 'react-bootstrap/Container'

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
    <ToggleButtonGroup variant="dark" type="radio" className="mb-2">
      {displayValues.map((value,i)=><ToggleButton variant="dark"  key={i} variant={selected===value[1]?"dark":"outline-dark"} onClick={handleChange} id={value[1]}>{value[0].label}</ToggleButton>)}
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

function getPlatform(platformID) {
  const { data,error } = useSWR("https://www.speedrun.com/api/v1/platforms/"+platformID,fetcher)

  return {
    platform: data?.data.name,
    isLoading: !error && !data,
    isError: error
  }
}

function getVersion(versionID) {
  const { data,error } = useSWR("https://www.speedrun.com/api/v1/variables/p85me3lg",fetcher)

  return {
    version: data?.data.values.values[versionID].label,
    isLoading: !error && !data,
    isError: error
  }
}

function getPlayer(playerID) {
  const { data,error } = useSWR("https://www.speedrun.com/api/v1/users/"+playerID,fetcher)
  return {
    name: data?.data.names.international,
    link: data?.data.weblink,
    color1: data?.data["name-style"]["color-from"]?.dark,
    color2: data?.data["name-style"]["color-to"]?.dark,
    country_code: data?.data.location?.country.code,
    country_name: data?.data.location?.country.names.international,
    twitch: data?.data.twitch?.uri,
    youtube: data?.data.youtube?.uri,
    icon: data?.data.assets.icon.uri,
    image: data?.data.assets.image.uri,
    isLoading: !error && !data,
    isError: error
  }
}

function Player(p) {
  const {data}=p
  const playerData=getPlayer(data.id)
  return <a key={data.id} href={playerData.link} className="leaderboardName"><img className="scoreboard_icon" width={24} height={24} src={playerData.icon??playerData.image}/> {playerData.name&&playerData.name.length>0&&<span className="playerName"><Gradient dir="left-to-right" from={playerData.color1} to={playerData.color2}>{data.rel==="guest"?data.name:playerData.name}</Gradient></span>}</a>
}

function TimeDisplay(time) {
  const hrs = Math.floor(time/3600)>0?Math.floor(time/3600):"";
  const min = Math.floor(time/60)>0?Math.floor(time/60%60):"00";
  const sec = Math.floor(time%60)>0?Math.floor(time%60):"00";
  const millis = time%1>0?Math.round(time%1*1000):"";

  return <>{(hrs>0?hrs+":":"")+min.toLocaleString('en-US',{minimumIntegerDigits:2})+":"+sec.toLocaleString('en-US',{minimumIntegerDigits:2})}<span className="bl-5" style={{width:"25px"}}>{millis>0&&<sub>{"."+millis.toLocaleString('en-US',{minimumIntegerDigits:3})+""}</sub>}</span></>
}

function Platform(p) {
  const {data} = p 
  const playerData=getPlatform(data)
  return <>{playerData.platform??""}</>
}

function Version(p) {
  const {data} = p
  const versionData=getVersion(data)
  return <>{versionData.version??""}</>
}

function Leaderboard(p) {
  const {data} = p
  return <Table striped bordered hover size="sm" variant="dark">
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
    {!data?<tr><td colSpan="8"><Spinner animation="grow" />Buns are loading...</td></tr>:data?.data.runs.map((run)=><tr className="leaderboardRow" onClick={()=>{window.location.href=run.run.weblink}}>
      <td>{run.place}</td>{/*#*/}
      <td><Player data={run.run.players[0]??{}}/></td>{/*Player*/}
      <td>{run.run.times.realtime_noloads_t?TimeDisplay(run.run.times.realtime_noloads_t):""}</td>{/*Time without loads*/}
      <td>{TimeDisplay(run.run.times.realtime_t)}</td>{/*Time with loads*/}
      <td>{<Platform data={run.run.system.platform}/>}</td>{/*Platform*/}
      <td>{<Version data={run.run.values.p85me3lg}/>}</td>{/*Version*/}
      <td>{run.run.date}</td>{/*Date*/}
      <td>{run.run.videos?.links[0].uri&&<a href={run.run.videos?.links[0].uri}><CameraReelsFill/></a>}</td>{/*Video*/}
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

  return <Container><Tabs className="mb-3" onSelect={(e)=>{setSelectedTab(e)}}>
    {CATEGORIES.map((cat)=><Tab key={cat.id} eventKey={cat.id} title={cat.name} id={cat.name}>
      {/*cat.rules*/}
      {VARIABLES.filter((v)=>(v.category===cat.id||v.category===null)&&v["is-subcategory"]).map((v,i)=><VariableSelector key={v.id} category={cat} selectionID={i} selectionValues={selectionValues} setSelectionValues={setSelectionValues} values={v}/>)}
    </Tab>)}
  </Tabs>
  {<Leaderboard data={data}/>}
  </Container>
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
