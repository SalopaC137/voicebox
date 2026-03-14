// University structure constants — shared by server utils
const SCHOOLS = [
  { code:"SAT", name:"Science & Applied Technology", departments:[
    {code:"BBS"},{code:"CHB"},{code:"MTH"},{code:"CIN"},{code:"EAS"},
  ]},
  { code:"EDU", name:"Education", departments:[
    {code:"CEM"},{code:"AGE"},
  ]},
  { code:"HDS", name:"Humanities & Development Studies", departments:[
    {code:"LCS"},{code:"SST"},
  ]},
  { code:"SBE", name:"Business & Economics", departments:[
    {code:"LGB"},
  ]},
];

const NON_ACADEMIC = [
  { code:"DIR", units:["TVET","Quality Assurance","Research & Gender","Planning","Corporate Affairs"] },
  { code:"SUP", units:["Library","Medical","Security","Transport","Procurement","Catering","Administrative Staff (Secretary)","Academic & Student Affairs"] },
  { code:"FRM", units:["Farm Operations","Farm Management"] },
];

module.exports = { SCHOOLS, NON_ACADEMIC };
