// ── University Structure ─────────────────────────────────────────
export const SCHOOLS = [
  { code:"SAT", name:"Science & Applied Technology", icon:"🔬", departments:[
    { code:"BBS", name:"Biological and Biomedical Sciences Technology", courses:[
        { code:"BIOMED", name:"Bachelor of Science in Biomedical Sciences and Technology" },
        { code:"BIOGEN", name:"Bachelor of Science (Biology option – General BSc)" },
    ] },
    { code:"CHB", name:"Chemistry and Biochemistry", courses:[
        { code:"BIOCHEM", name:"Bachelor of Science in Biochemistry" },
        { code:"CHEMGEN", name:"Bachelor of Science (Chemistry option – General BSc)" },
    ] },
    { code:"MTH", name:"Mathematics", courses:[
        { code:"STAT", name:"Bachelor of Science in Statistics" },
        { code:"MATHGEN", name:"Bachelor of Science (Mathematics option – General BSc)" },
    ] },
    { code:"CIN", name:"Computing and Informatics", courses:[
        { code:"CS", name:"Bachelor of Science in Computer Science" },
        { code:"ICT", name:"Bachelor of Science in Information and Communication Technology (ICT)" },
    ] },
    { code:"EAS", name:"Earth Sciences", courses:[
        { code:"GEO", name:"Bachelor of Science in Geography" },
        { code:"ENV", name:"Bachelor of Science in Environmental Science" },
        { code:"NRM", name:"Bachelor of Science in Natural Resource Management" },
        { code:"USAL", name:"Bachelor of Science in Utilization and Sustainability of Arid Lands" },
    ] },
  ]},
  { code:"EDU", name:"Education", icon:"📚", departments:[
    { code:"CEM", name:"Curriculum and Educational Management", courses:[
        { code:"BEDARTS", name:"Bachelor of Education (Arts)" },
        { code:"BEDSCI", name:"Bachelor of Education (Science)" },
        { code:"BEDECDE", name:"Bachelor of Education (Early Childhood Development Education – ECDE)" },
        { code:"BSCAGRED", name:"Bachelor of Science in Agricultural Education and Extension" },
    ] },
    { code:"PCEF", name:"Psychology, Counselling and Educational Foundations", courses:[
        { code:"DIPEDARTS", name:"Diploma in Education (Arts)" },
    ] },
  ]},
  { code:"HDS", name:"Humanities and Development Studies", icon:"🌍", departments:[
    { code:"LCS", name:"Literary and Communication Studies", courses:[
        { code:"BACOMMED", name:"Bachelor of Arts in Communication and Media" },
        { code:"BACOMENG", name:"Bachelor of Arts in Communication and English Language Studies" },
        { code:"BAKISCOM", name:"Bachelor of Arts in Kiswahili and Communication Studies" },
        { code:"BLIS", name:"Bachelor of Library and Information Studies (BLIS)" },
    ] },
    { code:"SST", name:"Social Studies", courses:[
        { code:"BACRIM", name:"Bachelor of Arts in Criminology and Security Studies" },
        { code:"BAPEACE", name:"Bachelor of Arts in Peace Education" },
        { code:"BSCDEV", name:"Bachelor of Science in Community Development" },
        { code:"BAHISTECON", name:"Bachelor of Arts (History and Economics)" },
        { code:"BAECONSOC", name:"Bachelor of Arts (Economics and Sociology)" },
        { code:"BPSYCH", name:"Bachelor of Psychology" },
    ] },
  ]},
  { code:"SBE", name:"Business and Economics", icon:"💼", departments:[
    { code:"COM", name:"Commerce", courses:[
        { code:"BCOM", name:"Bachelor of Commerce" },
        { code:"BAGRI", name:"Bachelor of Agribusiness Management" },
    ] },
    { code:"ECON", name:"Economics", courses:[
        { code:"BSCECONSTAT", name:"Bachelor of Science in Economics and Statistics" },
        { code:"BSCAGRECON", name:"Bachelor of Science in Agricultural Economics" },
    ] },
  ]},
];

export const TVET_PROGRAMMES = [
  {
    code:"TVET",
    name:"TVET Institute",
    icon:"🔧",
    programmes:[
      { code:"MECH", name:"Mechanical Engineering" },
      { code:"ELEC", name:"Electrical Engineering" },
      { code:"BUILD", name:"Building & Construction" },
      { code:"AUTO", name:"Automotive Technology" },
      { code:"AGRIC", name:"Agricultural Mechanization" },
      { code:"ICT", name:"Information & Communication Technology" },
      { code:"BUSM", name:"Business Management" },
    ],
  },
];

export const NON_ACADEMIC = [
  { code:"DIR", name:"Directorates", icon:"🏛️",
    units:["TVET","Quality Assurance","Research & Gender","Planning","Corporate Affairs"] },
  { code:"SUP", name:"Support Units", icon:"🔧",
    units:["Library","Medical","Security","Transport","Procurement","Catering",
           "Administrative Staff (Secretary)","Academic & Student Affairs"] },
  { code:"FRM", name:"Farm Department", icon:"🌾",
    units:["Farm Operations","Farm Management"] },
];

export const ROLE_LABELS = {
  staff:        { label:"Staff",        icon:"🛠️" },
  dept_admin:   { label:"Dept Admin",   icon:"🏬" },
  school_admin: { label:"School Admin", icon:"🏫" },
  student:      { label:"Student",      icon:"🎓" },
};

// Activation codes (stored in backend, only shown to authorized admins in registration)
export const SCHOOL_ADMIN_CODE = "654321";
export const DEPT_ADMIN_CODE   = "456789";

// Year of study options for students
export const YEAR_OF_STUDY = [
  { value: 1, label: "Year 1" },
  { value: 2, label: "Year 2" },
  { value: 3, label: "Year 3" },
  { value: 4, label: "Year 4" },
];

