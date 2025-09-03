import { Router } from "express";
import { ChoiceService } from "../../services/Teacher/choice.service";
import { ChoiceDao } from "../../daos/Teacher/choice.dao";
import { wrapAsync } from "../../utils/wrapAsync";
import { verifyToken } from "../../middleware/verifyToken";
import { Admin } from "../../middleware/CheckRole";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { ChoiceController } from "../../controllers/Teacher/choice.controller";

const router = Router();

// ✅ สร้าง instance DAO และ Service
const choiceDao = new ChoiceDao();
const choiceService = new ChoiceService(choiceDao);
const choiceController = new ChoiceController(choiceService)

// ✅ GET count
router.get(
    "/count", (choiceController.count.bind(choiceController))
);

// ✅ GET choices
router.get(
    "/get-choices", (choiceController.getAll.bind(choiceController))
);

router.get(
    "/get-choices-by-question/:question_id", (choiceController.getChoiceByQuestionID.bind(choiceController))
);

router.post(
    "/add", (choiceController.create.bind(choiceController))
);

router.put(
    "/edit/:choice_id", (choiceController.update.bind(choiceController))
);


router.delete(
    "/delete/:choice_id", (choiceController.delete.bind(choiceController))
);

export default router;
