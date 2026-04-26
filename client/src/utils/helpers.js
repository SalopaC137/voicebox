import { SCHOOLS } from "../data/university";
import S from "./styles";

export const getDeptName = code => {
  for (const s of SCHOOLS) {
    const d = s.departments.find(d => d.code === code);
    if (d) return d.name;
  }
  return code || "—";
};

export const getSchoolName = code => SCHOOLS.find(s => s.code === code)?.name || code || "—";

export const fmtDate = d =>
  new Date(d).toLocaleDateString("en-KE", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

export const normalizeComplaintStatus = (status) => {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (value === "inprogress") return "in-progress";
  return value;
};

export const statusBadge = s => {
  const value = normalizeComplaintStatus(s);
  return value === "open" ? S.badgeOpen : value === "in-progress" ? S.badgeProg : S.badgeRes;
};

export const roleIcon = r =>
  ({ school_admin:"🏫", dept_admin:"🏬", staff:"🛠", student:"🎓" }[r] || "👤");

export const rolePillStyle = r =>
  ({ school_admin:S.pillSchool, dept_admin:S.pillDept, staff:S.pillStaff, student:S.pillStudent }[r] || S.pillStaff);

export const isAdminRole = r => r === "school_admin" || r === "dept_admin";

// Filter complaints visible to a user
export const scopeComplaints = (complaints, user) => {
  if (!Array.isArray(complaints)) return [];
  if (user.role === "school_admin") return complaints.filter(c => c.targetSchool === user.school);
  if (user.role === "dept_admin")   return complaints.filter(c => c.targetDept === user.department && c.targetSchool === user.school);
  // For students/staff: own submissions + directed to them
  return complaints.filter(c => {
    const submitterMatch = (c.submittedBy && (String(c.submittedBy._id || c.submittedBy) === String(user._id || user.id)));
    const targetMatch = (String(c.targetLecturerId || c.targetLecturerId?._id) === String(user._id || user.id)) || c.targetLecturerUid === user.uniqueId;
    return submitterMatch || targetMatch;
  });
};

// Filter users visible to an admin
export const scopeUsers = (users, user) => {
  if (!Array.isArray(users)) return [];
  if (user.role === "school_admin") return users.filter(u => u.school === user.school);
  if (user.role === "dept_admin")   return users.filter(u => u.school === user.school && u.department === user.department);
  return [];
};

// Build chat rooms accessible to a user
export const buildRooms = (user, selectedProgramType = null) => {
  const { role, school, department, yearOfStudy, programType } = user;
  const activeProgramType = role === "student"
    ? (programType || "degree")
    : (selectedProgramType || "degree");

  // helper to create course entries with indentation
  // for students, append year to room id (e.g. course:CIN:CS:degree:Y1)
  const deptCourses = (d) => {
    if (!d || !Array.isArray(d.courses)) return [];
    return d.courses.map(c => {
      const programSegment = activeProgramType === "diploma" ? ":diploma" : "";
      const roomId = role === "student" && yearOfStudy
        ? `course:${d.code}:${c.code}${programSegment}:Y${yearOfStudy}`
        : `course:${d.code}:${c.code}${programSegment}`;
      return {
        id: roomId,
        label: `     └ 📘 ${c.name}${activeProgramType === "diploma" ? " (Diploma)" : " (Degree)"}`,
      };
    });
  };

  if (role === "school_admin") {
    const schoolObj = SCHOOLS.find(s => s.code === school);
    const rooms = [
      { id:`school:${school}`, label:`🏫 ${getSchoolName(school)} (School)` },
    ];
    if (schoolObj && schoolObj.departments) {
      schoolObj.departments.forEach(d => {
        rooms.push({ id:`dept:${d.code}`, label:`  └ ${d.name}` });
        rooms.push(...deptCourses(d));
      });
    }
    console.log(`[buildRooms] school_admin ${school}:`, rooms);
    return rooms;
  }
  if (role === "dept_admin") {
    const rooms = [
      { id:`dept:${department}`, label:`🏬 ${getDeptName(department)}` },
      { id:`school:${school}`,   label:`🏫 ${getSchoolName(school)} (School)` },
    ];
    // include our department's courses
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);
    if (myDept) rooms.push(...deptCourses(myDept));
    console.log(`[buildRooms] dept_admin ${department}:`, rooms);
    return rooms;
  }
  // staff & student
  const rooms = [{ id:`dept:${department}`, label:`💬 ${getDeptName(department)}` }];
  const allDepts = SCHOOLS.flatMap(s => s.departments || []);
  const myDept = allDepts.find(d => d.code === department);
  if (myDept) rooms.push(...deptCourses(myDept));
  console.log(`[buildRooms] ${role}:`, rooms);
  return rooms;
};
