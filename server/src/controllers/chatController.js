const Message = require("../models/Message");

// GET /api/chat (returns all messages for accessible rooms)
exports.getAllMessages = async (req, res) => {
  try {
    const allowed = allowedRooms(req.user);
    const messages = await Message.find({ room: { $in: allowed } })
      .sort({ createdAt: 1 })
      .limit(500);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/messages?room=dept:CIN (get messages for specific room)
exports.getMessages = async (req, res) => {
  try {
    const { room } = req.query;
    if (!room) return res.status(400).json({ message: "room query param required." });

    // Scope guard: users can only read rooms they belong to
    const allowed = allowedRooms(req.user);
    if (!allowed.includes(room)) return res.status(403).json({ message: "Room not in your scope." });

    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/chat/messages  (fallback REST — real-time via Socket.io)
exports.postMessage = async (req, res) => {
  try {
    const { room, message, isAnonymous, isVoice, audioData, audioDuration } = req.body;
    const allowed = allowedRooms(req.user);
    if (!allowed.includes(room)) return res.status(403).json({ message: "Room not in your scope." });

    const msg = await Message.create({
      sender:      req.user._id,
      senderUid:   req.user.uniqueId,
      senderFirstName: req.user.firstName,
      senderLastName:  req.user.lastName,
      senderRole:  req.user.role,
      isAnonymous: !!isAnonymous,
      room,
      message:     isVoice ? "🎤 Voice message" : (message || ""),
      isVoice:     !!isVoice,
      audioData:   isVoice ? audioData : null,
      audioDuration: isVoice ? audioDuration : 0,
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: rooms a user is allowed to access
function allowedRooms(user) {
  const { role, school, department } = user;
  const { SCHOOLS } = require("../utils/constants");

  const COURSE_CODE_ALIASES = {
    CIN: {
      IT: ["ICT"],
      ICT: ["IT"],
    },
  };

  const normalize = (v) => String(v || "").trim().toUpperCase();

  const expandCourseCodes = (deptCode, courseCode) => {
    const d = normalize(deptCode);
    const c = normalize(courseCode);
    if (!c) return [];
    const aliases = COURSE_CODE_ALIASES[d]?.[c] || [];
    return Array.from(new Set([c, ...aliases.map(normalize)]));
  };

  const toCourseRoomIds = (deptCode, courseCode, year = null) => {
    const d = normalize(deptCode);
    return expandCourseCodes(d, courseCode).map((c) => {
      const baseRoom = `course:${d}:${c}`;
      return year ? `${baseRoom}:Y${year}` : baseRoom;
    });
  };

  // build a list of course room ids for a given department object
  // if year is provided (for students), append Y{year} to course room IDs
  const courseRoomsFor = (d, year = null) => {
    if (!d || !Array.isArray(d.courses)) return [];
    return d.courses.flatMap((c) => toCourseRoomIds(d.code, c.code, year));
  };

  if (role === "school_admin") {
    const schoolDepts = SCHOOLS.find(s => s.code === school)?.departments || [];
    const rooms = [
      `school:${school}`,
      ...schoolDepts.map(d => `dept:${d.code}`),
    ];
    // add all course rooms for every department in the school (base + all year variants)
    schoolDepts.forEach(d => {
      rooms.push(...courseRoomsFor(d)); // base rooms
      [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(d, y))); // year-specific rooms
    });
    return Array.from(new Set(rooms));
  }
  if (role === "dept_admin") {
    const rooms = [`dept:${department}`, `school:${school}`];
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);
    if (myDept) {
      rooms.push(...courseRoomsFor(myDept)); // base
      [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(myDept, y))); // year variants
    }
    return Array.from(new Set(rooms));
  }
  if (role === "staff" || role === "student") {
    const rooms = [`dept:${department}`];
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);

    // Always include department-defined course rooms to avoid partial access
    // when stale user.courses values exist.
    if (myDept) {
      if (role === "student" && user.yearOfStudy) {
        rooms.push(...courseRoomsFor(myDept, user.yearOfStudy));
      } else if (role === "staff") {
        rooms.push(...courseRoomsFor(myDept));
        [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(myDept, y)));
      }
    }

    // Include explicitly assigned courses as an additive source and normalize
    // legacy values (e.g. CIN:IT vs CIN:ICT).
    if (Array.isArray(user.courses) && user.courses.length > 0) {
      user.courses.forEach((entry) => {
        const parts = String(entry || "").split(":").map(normalize);
        let deptCode = normalize(department);
        let courseCode = "";

        if (parts.length >= 2) {
          deptCode = parts[0] || deptCode;
          courseCode = parts[1] || "";
        } else {
          courseCode = parts[0] || "";
        }

        if (!courseCode) return;

        if (role === "student" && user.yearOfStudy) {
          rooms.push(...toCourseRoomIds(deptCode, courseCode, user.yearOfStudy));
        } else {
          rooms.push(...toCourseRoomIds(deptCode, courseCode));
          [1,2,3,4].forEach(y => rooms.push(...toCourseRoomIds(deptCode, courseCode, y)));
        }
      });
    }

    return Array.from(new Set(rooms));
  }
  return [];
}

module.exports.allowedRooms = allowedRooms;

