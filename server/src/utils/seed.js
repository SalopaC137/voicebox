require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const Complaint= require("../models/Complaint");
const Message  = require("../models/Message");

const hash = (pw) => bcrypt.hash(pw, 12);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  Connected to MongoDB");

  // Clear existing
  await Promise.all([User.deleteMany(), Complaint.deleteMany(), Message.deleteMany()]);
  console.log("🗑️   Cleared existing data");

  // Create users
  const users = await User.insertMany([
    { uniqueId:"SAD-SAT-0001", role:"school_admin", firstName:"Dr. Grace",   lastName:"Mwenda",  email:"g.mwenda@laikipia.ac.ke",            phone:"0722900001", password:await hash("sadmin123"),  school:"SAT", department:null,  designation:"School Dean" },
    { uniqueId:"SAD-EDU-0001", role:"school_admin", firstName:"Prof. David", lastName:"Rotich",  email:"d.rotich@laikipia.ac.ke",            phone:"0722900002", password:await hash("sadmin123"),  school:"EDU", department:null,  designation:"School Dean" },
    { uniqueId:"DAD-CIN-0001", role:"dept_admin",   firstName:"Dr. Samuel",  lastName:"Kariuki", email:"s.kariuki@laikipia.ac.ke",           phone:"0722111001", password:await hash("dadmin123"),  school:"SAT", department:"CIN", designation:"HoD / Senior Lecturer" },
    { uniqueId:"DAD-CEM-0001", role:"dept_admin",   firstName:"Prof. Jane",  lastName:"Wanja",   email:"j.wanja@laikipia.ac.ke",             phone:"0722111002", password:await hash("dadmin123"),  school:"EDU", department:"CEM", designation:"HoD / Professor" },
    { uniqueId:"STF-LGB-0001", role:"staff",        firstName:"Mr. Brian",   lastName:"Ochieng", email:"b.ochieng@laikipia.ac.ke",           phone:"0722111003", password:await hash("staff123"),   school:"SBE", department:"LGB", designation:"Lecturer" },
    { uniqueId:"STF-MTH-0001", role:"staff",        firstName:"Dr. Peter",   lastName:"Omondi",  email:"p.omondi@laikipia.ac.ke",            phone:"0722111005", password:await hash("staff123"),   school:"SAT", department:"MTH", designation:"Lecturer" },
    { uniqueId:"STF-CIN-0002", role:"staff",        firstName:"Ms. Faith",   lastName:"Waweru",  email:"f.waweru@laikipia.ac.ke",            phone:"0722111006", password:await hash("staff123"),   school:"SAT", department:"CIN", designation:"Tutorial Fellow" },
    { uniqueId:"STU-SAT-00001",role:"student",      firstName:"Jane",        lastName:"Mwangi",  email:"j.mwangi@students.laikipia.ac.ke",   phone:"0712000001", password:await hash("student123"), school:"SAT", department:"CIN", regNumber:"LU/2023/SAT/0001" },
    { uniqueId:"STU-EDU-00001",role:"student",      firstName:"Kevin",       lastName:"Njuguna", email:"k.njuguna@students.laikipia.ac.ke",  phone:"0712000002", password:await hash("student123"), school:"EDU", department:"CEM", regNumber:"LU/2023/EDU/0001" },
  ]);
  console.log(`👥  Created ${users.length} users`);

  const byUid = (uid) => users.find(u => u.uniqueId === uid);

  // Complaints
  await Complaint.insertMany([
    {
      submittedBy: byUid("STU-SAT-00001")._id, submitterUid:"STU-SAT-00001", isAnonymous:false,
      type:"complaint", title:"CAT practicals cancelled without notice",
      description:"The CAT 3 practical session on Monday was cancelled without prior notice. Students had already traveled to campus.",
      targetSchool:"SAT", targetDept:"CIN",
      targetLecturerId: byUid("DAD-CIN-0001")._id, targetLecturerUid:"DAD-CIN-0001",
      category:"Academic", priority:"high", status:"open",
    },
    {
      submittedBy: byUid("STU-SAT-00001")._id, submitterUid:"STU-SAT-00001", isAnonymous:true,
      type:"suggestion", title:"Install water dispensers in Science Block",
      description:"Students need access to clean drinking water during long lab sessions.",
      targetSchool:"SAT", targetDept:"CIN",
      targetLecturerId: byUid("STF-CIN-0002")._id, targetLecturerUid:"STF-CIN-0002",
      category:"Welfare", priority:"medium", status:"in-progress",
      replies:[{ senderId:byUid("STF-CIN-0002")._id, senderUid:"STF-CIN-0002", senderName:"Ms. Faith Waweru", message:"Forwarded to facilities team." }],
    },
    {
      submittedBy: byUid("DAD-CIN-0001")._id, submitterUid:"DAD-CIN-0001", isAnonymous:false,
      type:"complaint", title:"Projector in Lab C not fixed after 3 weeks",
      description:"I reported the projector issue in Lab C three weeks ago with no resolution.",
      targetSchool:"SAT", targetDept:"CIN",
      targetLecturerId: byUid("SAD-SAT-0001")._id, targetLecturerUid:"SAD-SAT-0001",
      category:"Infrastructure", priority:"high", status:"open",
    },
  ]);
  console.log("📋  Created seed complaints");

  // Messages
  await Message.insertMany([
    { sender:byUid("DAD-CIN-0001")._id, senderUid:"DAD-CIN-0001", senderName:"Dr. Samuel Kariuki", senderRole:"dept_admin", isAnonymous:false, room:"dept:CIN", message:"Reminder: CAT 3 practical rescheduled to Wednesday 12th at 9AM in Lab D." },
    { sender:byUid("STU-SAT-00001")._id, senderUid:"STU-SAT-00001", senderName:"Jane Mwangi", senderRole:"student", isAnonymous:true, room:"dept:CIN", message:"Will students who missed be penalised? We weren't notified." },
    { sender:byUid("SAD-SAT-0001")._id, senderUid:"SAD-SAT-0001", senderName:"Dr. Grace Mwenda", senderRole:"school_admin", isAnonymous:false, room:"school:SAT", message:"All departments: timetables must be finalised and shared with students by Friday." },
  ]);
  console.log("💬  Created seed messages");

  console.log("\n🎉  Seed complete!\n");
  console.log("Demo logins:");
  console.log("  🏫 School Admin  g.mwenda@laikipia.ac.ke        / sadmin123");
  console.log("  🏬 Dept Admin    s.kariuki@laikipia.ac.ke       / dadmin123");
  console.log("  🛠️  Staff         p.omondi@laikipia.ac.ke        / staff123");
  console.log("  🎓 Student       j.mwangi@students.laikipia.ac.ke / student123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
