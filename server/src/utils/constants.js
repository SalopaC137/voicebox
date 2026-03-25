// University structure constants — shared by server utils
const SCHOOLS = [
  { code:"SAT", name:"Science & Applied Technology", departments:[
    {code:"BBS", courses:[{code:"BIOMED"},{code:"BIOGEN"}]},
    {code:"CHB", courses:[{code:"BIOCHEM"},{code:"CHEMGEN"}]},
    {code:"MTH", courses:[{code:"STAT"},{code:"MATHGEN"}]},
    {code:"CIN", courses:[{code:"CS"},{code:"ICT"}]},
    {code:"EAS", courses:[{code:"GEO"},{code:"ENV"},{code:"NRM"},{code:"USAL"}]},
  ]},
  { code:"EDU", name:"Education", departments:[
    {code:"CEM", courses:[{code:"BEDARTS"},{code:"BEDSCI"},{code:"BEDECDE"},{code:"BSCAGRED"}]},
    {code:"PCEF", courses:[{code:"DIPEDARTS"}]},
  ]},
  { code:"HDS", name:"Humanities & Development Studies", departments:[
    {code:"LCS", courses:[{code:"BACOMMED"},{code:"BACOMENG"},{code:"BAKISCOM"},{code:"BLIS"}]},
    {code:"SST", courses:[{code:"BACRIM"},{code:"BAPEACE"},{code:"BSCDEV"},{code:"BAHISTECON"},{code:"BAECONSOC"},{code:"BPSYCH"}]},
  ]},
  { code:"SBE", name:"Business & Economics", departments:[
    {code:"COM", courses:[{code:"BCOM"},{code:"BAGRI"}]},
    {code:"ECON", courses:[{code:"BSCECONSTAT"},{code:"BSCAGRECON"}]},
  ]},
];

const TVET_PROGRAMMES = [
  { code:"MECH", name:"Mechanical Engineering" },
  { code:"ELEC", name:"Electrical Engineering" },
  { code:"BUILD", name:"Building & Construction" },
  { code:"AUTO", name:"Automotive Technology" },
  { code:"AGRIC", name:"Agricultural Mechanization" },
  { code:"ICT", name:"Information & Communication Technology" },
  { code:"BUSM", name:"Business Management" },
];

const NON_ACADEMIC = [
  { code:"DIR", units:["TVET","Quality Assurance","Research & Gender","Planning","Corporate Affairs"] },
  { code:"SUP", units:["Library","Medical","Security","Transport","Procurement","Catering","Administrative Staff (Secretary)","Academic & Student Affairs"] },
  { code:"FRM", units:["Farm Operations","Farm Management"] },
];

module.exports = { SCHOOLS, NON_ACADEMIC, TVET_PROGRAMMES };
