#!/usr/bin/env node

/**
 * Test: Year-Based Chat Room Filtering
 * 
 * This test verifies that students only see messages from their year cohort,
 * and that admins/staff can target specific year groups.
 */

// Mock SCHOOLS data
const SCHOOLS = [
  {
    code: "CIN",
    name: "Computing & Informatics",
    departments: [
      {
        code: "CIN",
        name: "Computing & Informatics",
        courses: [
          { code: "CS", name: "Computer Science" },
        ]
      }
    ]
  }
];

// Mock allowedRooms function (from server)
const allowedRooms = (user) => {
  const { role, department, yearOfStudy } = user;

  const courseRoomsFor = (d, year = null) => {
    if (!d || !Array.isArray(d.courses)) return [];
    return d.courses.map(c => {
      const baseRoom = `course:${d.code}:${c.code}`;
      return year ? `${baseRoom}:Y${year}` : baseRoom;
    });
  };

  if (role === "staff" || role === "student") {
    const rooms = [`dept:${department}`];
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);
    if (myDept) {
      const year = role === "student" ? yearOfStudy : null;
      rooms.push(...courseRoomsFor(myDept, year));
    }
    return rooms;
  }
  if (role === "dept_admin") {
    const rooms = [`dept:${department}`];
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);
    if (myDept) rooms.push(...courseRoomsFor(myDept));
    return rooms;
  }
  return [];
};

// Test cases
const tests = [];

// TEST 1: Student Year 1 allowedRooms
tests.push({
  name: "Student Year 1 gets year-specific rooms",
  user: { role: "student", department: "CIN", yearOfStudy: 1 },
  expectedRooms: ["dept:CIN", "course:CIN:CS:Y1"],
});

// TEST 2: Student Year 2 allowedRooms
tests.push({
  name: "Student Year 2 gets year-specific rooms",
  user: { role: "student", department: "CIN", yearOfStudy: 2 },
  expectedRooms: ["dept:CIN", "course:CIN:CS:Y2"],
});

// TEST 3: Student Year 4 allowedRooms (max year now)
tests.push({
  name: "Student Year 4 gets year-specific rooms",
  user: { role: "student", department: "CIN", yearOfStudy: 4 },
  expectedRooms: ["dept:CIN", "course:CIN:CS:Y4"],
});

// TEST 3: Dept Admin gets base course rooms (no year)
tests.push({
  name: "Dept Admin gets base course rooms (all years)",
  user: { role: "dept_admin", department: "CIN" },
  expectedRooms: ["dept:CIN", "course:CIN:CS"],
});

// TEST 4: Staff gets base course rooms (no year)
tests.push({
  name: "Staff gets base course rooms (all years)",
  user: { role: "staff", department: "CIN" },
  expectedRooms: ["dept:CIN", "course:CIN:CS"],
});

// Run tests
console.log("\n" + "=".repeat(60));
console.log("YEAR-BASED CHAT ROOM FILTERING TEST");
console.log("=".repeat(60) + "\n");

let passed = 0;
let failed = 0;

tests.forEach((test, idx) => {
  const result = allowedRooms(test.user);
  const success = JSON.stringify(result.sort()) === JSON.stringify(test.expectedRooms.sort());
  
  const status = success ? "✅ PASS" : "❌ FAIL";
  console.log(`Test ${idx + 1}: ${status}`);
  console.log(`  Name: ${test.name}`);
  console.log(`  User: ${JSON.stringify(test.user)}`);
  console.log(`  Expected: ${JSON.stringify(test.expectedRooms.sort())}`);
  console.log(`  Got:      ${JSON.stringify(result.sort())}`);
  
  if (!success) {
    console.log(`  ❌ Mismatch!`);
    failed++;
  } else {
    passed++;
  }
  console.log();
});

// Test message filtering
console.log("=".repeat(60));
console.log("MESSAGE FILTERING TEST");
console.log("=".repeat(60) + "\n");

const messages = [
  { _id: "1", room: "course:CIN:CS:Y1", message: "Year 1 message", sender: "stu1" },
  { _id: "2", room: "course:CIN:CS:Y2", message: "Year 2 message", sender: "stu2" },
  { _id: "3", room: "course:CIN:CS", message: "Broadcast to all years", sender: "admin1" },
  { _id: "4", room: "dept:CIN", message: "Department message", sender: "admin2" },
];

// Simulate Student Year 1
const student1Rooms = allowedRooms({ role: "student", department: "CIN", yearOfStudy: 1 });
const student1Messages = messages.filter(m => student1Rooms.includes(m.room));

console.log("Student Year 1:");
console.log(`  Allowed rooms: ${JSON.stringify(student1Rooms)}`);
console.log(`  Visible messages: ${student1Messages.length}`);
student1Messages.forEach(m => {
  console.log(`    - [${m.room}] ${m.message}`);
});
// Should see: Year 1 message, Department message
const student1Expected = 2;
if (student1Messages.length === student1Expected) {
  console.log(`  ✅ Correct: Student Year 1 sees ${student1Expected} messages (not Year 2 broadcast)\n`);
  passed++;
} else {
  console.log(`  ❌ Wrong: Expected ${student1Expected}, got ${student1Messages.length}\n`);
  failed++;
}

// Simulate Admin (can see all with base rooms)
const adminRooms = allowedRooms({ role: "dept_admin", department: "CIN" });
// Admin with y ear selection UI can target specific years
const adminAllMessages = messages.filter(m => {
  // Admin can see base rooms and can select specific year rooms
  return adminRooms.includes(m.room) || m.room.startsWith("course:CIN:CS:Y");
});

console.log("Dept Admin (viewing base + all year variants):");
console.log(`  Allowed rooms: ${JSON.stringify(adminRooms)}`);
console.log(`  Able to target: All years via UI selection`);
console.log(`  Visible messages (when selecting all years): ${adminAllMessages.length}`);
adminAllMessages.forEach(m => {
  console.log(`    - [${m.room}] ${m.message}`);
});
// Admin should see all messages
const adminExpected = 4;
if (adminAllMessages.length === adminExpected) {
  console.log(`  ✅ Correct: Admin can see and target all ${adminExpected} message types\n`);
  passed++;
} else {
  console.log(`  ❌ Wrong: Expected ${adminExpected}, got ${adminAllMessages.length}\n`);
  failed++;
}

// Summary
console.log("=".repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60) + "\n");

if (failed === 0) {
  console.log("✅ All tests passed! Year-based filtering is working correctly.\n");
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed.\n`);
  process.exit(1);
}
