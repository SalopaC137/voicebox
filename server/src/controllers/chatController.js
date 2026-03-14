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

  // build a list of course room ids for a given department object
  // if year is provided (for students), append Y{year} to course room IDs
  const courseRoomsFor = (d, year = null) => {
    if (!d || !Array.isArray(d.courses)) return [];
    return d.courses.map(c => {
      const baseRoom = `course:${d.code}:${c.code}`;
      // Append year suffix for students with year of study
      return year ? `${baseRoom}:Y${year}` : baseRoom;
    });
  };

  if (role === "school_admin") {
    const schoolDepts = SCHOOLS.find(s => s.code === school)?.departments || [];
    let rooms = [
      `school:${school}`,
      ...schoolDepts.map(d => `dept:${d.code}`),
    ];
    // add all course rooms for every department in the school (base + all year variants)
    schoolDepts.forEach(d => {
      rooms.push(...courseRoomsFor(d)); // base rooms
      [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(d, y))); // year-specific rooms
    });
    return rooms;
  }
  if (role === "dept_admin") {
    const rooms = [`dept:${department}`, `school:${school}`];
    const allDepts = SCHOOLS.flatMap(s => s.departments || []);
    const myDept = allDepts.find(d => d.code === department);
    if (myDept) {
      rooms.push(...courseRoomsFor(myDept)); // base
      [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(myDept, y))); // year variants
    }
    return rooms;
  }
  if (role === "staff" || role === "student") {
    const rooms = [`dept:${department}`];
    // if the user has an explicit course list, only include those; otherwise
    // fall back to all courses in the department.
    if (Array.isArray(user.courses) && user.courses.length > 0) {
      user.courses.forEach(c => {
        // course entries are expected to be stored with dept prefix
        // For students, append year suffix to limit to their year cohort
        const room = role === "student" && user.yearOfStudy
          ? `course:${c}:Y${user.yearOfStudy}`
          : `course:${c}`;
        rooms.push(room);
      });
    } else {
      const allDepts = SCHOOLS.flatMap(s => s.departments || []);
      const myDept = allDepts.find(d => d.code === department);
      if (myDept) {
        // For students, only their year; for staff, base + all year variants
        if (role === "student" && user.yearOfStudy) {
          rooms.push(...courseRoomsFor(myDept, user.yearOfStudy));
        } else if (role === "staff") {
          rooms.push(...courseRoomsFor(myDept)); // base
          [1,2,3,4].forEach(y => rooms.push(...courseRoomsFor(myDept, y))); // year variants
        }
      }
    }
    return rooms;
  }
  return [];
}

module.exports.allowedRooms = allowedRooms;

