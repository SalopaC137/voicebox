// University structure constants — shared by server utils
const SCHOOLS = [
  { code:"SAT", name:"Science & Applied Technology", departments:[
    {code:"BBS", courses:[{code:"BIO"},{code:"MLS"},{code:"HAM"}]},
    {code:"CHB", courses:[{code:"CHEM"},{code:"BIOC"},{code:"INDCHEM"}]},
    {code:"MTH", courses:[{code:"MATH"},{code:"MATHSTAT"},{code:"PURENM"}]},
    {code:"CIN", courses:[{code:"CS"},{code:"IT"},{code:"SE"},{code:"IS"}]},
    {code:"EAS", courses:[{code:"GEO"},{code:"ENV"},{code:"AGS"}]},
  ]},
  { code:"EDU", name:"Education", departments:[
    {code:"CEM", courses:[{code:"CEM01"},{code:"EDM"},{code:"TEACHMATH"},{code:"SCIENCED"}]},
    {code:"AGE", courses:[{code:"AGR"},{code:"AGTECH"}]},
  ]},
  { code:"HDS", name:"Humanities & Development Studies", departments:[
    {code:"LCS", courses:[{code:"ENG"},{code:"COM"},{code:"KISWAHILI"}]},
    {code:"SST", courses:[{code:"HIST"},{code:"GEO"},{code:"POL"},{code:"SOCIO"}]},
  ]},
  { code:"SBE", name:"Business & Economics", departments:[
    {code:"LGB", courses:[{code:"ACC"},{code:"FIN"},{code:"MARKETING"},{code:"HRM"},{code:"LOGISTICS"}]},
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
