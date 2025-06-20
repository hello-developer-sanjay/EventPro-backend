const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware");
const Event = require("../models/Event");

router.post(
  "/",
  auth,
  [
    check("eventName", "Event name is required").not().isEmpty(),
    check("eventType", "Event type is required").not().isEmpty(),
    check("startDate", "Start date is required").not().isEmpty(),
    check("endDate", "End date is required").not().isEmpty(),
    check("description", "Description is required").not().isEmpty(),
    check("handledBy", "Handled by is required").not().isEmpty(),
    check("organisation", "Organisation is required").not().isEmpty(),
    check("totalSubEvents", "Total sub-events is required").isInt({ min: 0 }),
  ],
  async (req, res) => {
    console.log("POST /api/events - Request received:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newEvent = new Event({
        eventName: req.body.eventName,
        eventType: req.body.eventType,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        description: req.body.description,
        handledBy: req.body.handledBy,
        organisation: req.body.organisation,
        totalSubEvents: parseInt(req.body.totalSubEvents),
        user: req.user.id,
        platform: "eventpro",
      });

      console.log("New Event object created:", newEvent);

      const event = await newEvent.save();
      console.log("Event saved successfully:", event);
      res.json({ event });
    } catch (err) {
      console.error("Error saving event:", err.message);
      res.status(500).send("Server Error");
    }
  }
);

router.get("/", auth, async (req, res) => {
  console.log("GET /api/events - Request received");
  try {
    const events = await Event.find({ user: req.user.id, platform: "eventpro" }).sort({ startDate: -1 });
    console.log("Events fetched successfully:", events);
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/:id", auth, async (req, res) => {
  console.log("GET /api/events/:id - Request received with ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log("Invalid event ID");
    return res.status(400).json({ msg: "Invalid event ID" });
  }

  try {
    const event = await Event.findOne({ _id: req.params.id, platform: "eventpro" });

    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ msg: "Event not found" });
    }

    if (event.user.toString() !== req.user.id) {
      console.log("User not authorized");
      return res.status(401).json({ msg: "User not authorized" });
    }

    console.log("Event fetched successfully:", event);
    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err.message);
    res.status(500).send("Server Error");
  }
});

router.put("/:id", auth, async (req, res) => {
  console.log("PUT /api/events/:id - Request received with ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log("Invalid event ID");
    return res.status(400).json({ msg: "Invalid event ID" });
  }

  const { eventName, eventType, startDate, endDate, description, handledBy, organisation, totalSubEvents } = req.body;

  const eventFields = {};
  if (eventName) eventFields.eventName = eventName;
  if (eventType) eventFields.eventType = eventType;
  if (startDate) eventFields.startDate = new Date(startDate);
  if (endDate) eventFields.endDate = new Date(endDate);
  if (description) eventFields.description = description;
  if (handledBy) eventFields.handledBy = handledBy;
  if (organisation) eventFields.organisation = organisation;
  if (totalSubEvents !== undefined) eventFields.totalSubEvents = parseInt(totalSubEvents);
  eventFields.platform = "eventpro";

  try {
    let event = await Event.findOne({ _id: req.params.id, platform: "eventpro" });

    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ msg: "Event not found" });
    }

    if (event.user.toString() !== req.user.id) {
      console.log("User not authorized");
      return res.status(401).json({ msg: "User not authorized" });
    }

    event = await Event.findByIdAndUpdate(req.params.id, { $set: eventFields }, { new: true });

    console.log("Event updated successfully:", event);
    res.json(event);
  } catch (err) {
    console.error("Error updating event:", err.message);
    res.status(500).send("Server Error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  console.log("DELETE /api/events/:id - Request received with ID:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log("Invalid event ID");
    return res.status(400).json({ msg: "Invalid event ID" });
  }

  try {
    let event = await Event.findOne({ _id: req.params.id, platform: "eventpro" });

    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ msg: "Event not found" });
    }

    if (event.user.toString() !== req.user.id) {
      console.log("User not authorized");
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Event.findByIdAndDelete(req.params.id);

    console.log("Event removed successfully");
    res.json({ msg: "Event removed" });
  } catch (err) {
    console.error("Error deleting event:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
