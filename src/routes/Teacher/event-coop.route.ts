import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";

// import controller
import { eventCoopController } from "../../controllers/Teacher/event-coop.controller";

// import validate function & middleware
import { validateDTO } from "../../middleware/validateDTO.validator";
import { requestValidator } from "../../middleware/requestValidator";

// import utils
import { wrapAsync } from "../../utils/wrapAsync";

// import DTO
import { UpdateEventCoopDto } from "../../dtos/eventCoop/update-event-coop.dto";

const router = Router();

// GET METHOD
router.get("/get-event-coops", wrapAsync(eventCoopController.getAllEventCoops));

router.get("/get-event-coop/:eventCoopId", wrapAsync(eventCoopController.getEventCoopById));

router.get("/get-event-coops-by-department/:departmentId", wrapAsync(eventCoopController.getEventCoopByDepartment));

// POST METHOD
router.post("/create-event-coop", wrapAsync(eventCoopController.createEventCoop));

// PATCH METHOD - Update Event Coop (Partial Update)
router.patch(
  "/update-event-coop/:eventCoopId",
  validateDTO(UpdateEventCoopDto),
  wrapAsync(eventCoopController.updateEventCoop)
);

// DELETE METHOD
router.delete("/delete-event-coop/:eventCoopId", wrapAsync(eventCoopController.deleteEventCoop));

export default router;
