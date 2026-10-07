const HostelModel = require('../models/hostelModel');
const UserModel   = require('../models/userModel');

// ── Helpers ────────────────────────────────────────────────────────────────

// Warden can only act on the hostel they are assigned to
async function assertWardenOwnership(wardenUserId, hostelId) {
  const assigned = await HostelModel.findByWardenId(wardenUserId);
  if (!assigned || assigned.id !== Number(hostelId)) {
    const err = new Error('Access denied. You can only manage your own hostel.');
    err.statusCode = 403;
    throw err;
  }
}

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/hostels  — Admin only
async function createHostel(req, res) {
  const { name, address, warden_id } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Hostel name is required' });
  }

  const duplicate = await HostelModel.findByName(name.trim());
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'A hostel with this name already exists' });
  }

  // Validate warden_id if provided
  if (warden_id) {
    const warden = await UserModel.findById(warden_id);
    if (!warden) {
      return res.status(400).json({ success: false, message: 'Provided warden_id does not exist' });
    }
    if (warden.role !== 'warden') {
      return res.status(400).json({ success: false, message: 'The assigned user must have the warden role' });
    }
    // Prevent one warden from managing two hostels
    const alreadyAssigned = await HostelModel.findByWardenId(warden_id);
    if (alreadyAssigned) {
      return res.status(409).json({
        success: false,
        message: `This warden is already assigned to hostel "${alreadyAssigned.name}"`,
      });
    }
  }

  const id = await HostelModel.create({ name: name.trim(), address, warden_id: warden_id || null });
  const hostel = await HostelModel.findById(id);
  res.status(201).json({ success: true, message: 'Hostel created successfully', hostel });
}

// GET /api/hostels  — Admin, Warden, Student
async function getAllHostels(req, res) {
  const hostels = await HostelModel.findAll();
  res.json({ success: true, count: hostels.length, hostels });
}

// GET /api/hostels/:id  — Admin, Warden, Student
async function getHostelById(req, res) {
  const hostel = await HostelModel.findById(req.params.id);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }
  res.json({ success: true, hostel });
}

// PUT /api/hostels/:id  — Admin (any hostel) | Warden (own hostel only, cannot change warden_id)
async function updateHostel(req, res) {
  const hostel = await HostelModel.findById(req.params.id);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  // Wardens may only update name/address of their own hostel
  if (req.user.role === 'warden') {
    await assertWardenOwnership(req.user.id, req.params.id);
    // Wardens cannot reassign the warden
    if (req.body.warden_id !== undefined) {
      return res.status(403).json({ success: false, message: 'Wardens cannot change the assigned warden' });
    }
  }

  const name      = req.body.name      !== undefined ? req.body.name.trim()   : hostel.name;
  const address   = req.body.address   !== undefined ? req.body.address        : hostel.address;
  const warden_id = req.body.warden_id !== undefined ? req.body.warden_id      : hostel.warden_id;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Hostel name cannot be empty' });
  }

  // Duplicate name check — ignore self
  const duplicate = await HostelModel.findByName(name);
  if (duplicate && duplicate.id !== Number(req.params.id)) {
    return res.status(409).json({ success: false, message: 'Another hostel with this name already exists' });
  }

  // Validate new warden_id if admin is changing it
  if (warden_id && warden_id !== hostel.warden_id) {
    const warden = await UserModel.findById(warden_id);
    if (!warden) {
      return res.status(400).json({ success: false, message: 'Provided warden_id does not exist' });
    }
    if (warden.role !== 'warden') {
      return res.status(400).json({ success: false, message: 'The assigned user must have the warden role' });
    }
    const alreadyAssigned = await HostelModel.findByWardenId(warden_id);
    if (alreadyAssigned && alreadyAssigned.id !== Number(req.params.id)) {
      return res.status(409).json({
        success: false,
        message: `This warden is already assigned to hostel "${alreadyAssigned.name}"`,
      });
    }
  }

  await HostelModel.update(req.params.id, { name, address, warden_id: warden_id || null });
  const updated = await HostelModel.findById(req.params.id);
  res.json({ success: true, message: 'Hostel updated successfully', hostel: updated });
}

// DELETE /api/hostels/:id  — Admin only
async function deleteHostel(req, res) {
  const hostel = await HostelModel.findById(req.params.id);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }
  await HostelModel.delete(req.params.id);
  res.json({ success: true, message: 'Hostel deleted successfully' });
}

// GET /api/hostels/my  — Warden only: returns the hostel assigned to the logged-in warden
async function getMyHostel(req, res) {
  const hostel = await HostelModel.findByWardenId(req.user.id);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'No hostel is assigned to you yet' });
  }
  res.json({ success: true, hostel });
}

module.exports = { createHostel, getAllHostels, getHostelById, updateHostel, deleteHostel, getMyHostel };
