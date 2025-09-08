import { Router } from "express";
import { QuestionService } from "../../services/Teacher/question.service";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { wrapAsync } from "../../utils/wrapAsync";
import { verifyToken } from "../../middleware/verifyToken";
import { Admin } from "../../middleware/CheckRole";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { QuestionController } from "../../controllers/Teacher/question.controller copy";

const router = Router();

// ✅ สร้าง instance DAO และ Service
const questionDao = new QuestionDao();
const questionService = new QuestionService(questionDao);
const questionController = new QuestionController(questionService)

// ✅ GET count
router.get(
    "/count", (questionController.count.bind(questionController))
);

// ✅ GET questions
router.get(
    "/get-questions", (questionController.getAll.bind(questionController))
);

router.get(
    "/get-questions-by-setNumber/:set_number_id", (questionController.getQuestionBySetNumberID.bind(questionController))
);

router.post(
    "/add", (questionController.create.bind(questionController))
);


router.post(
    "/add-with-choices",
    (questionController.createWithChoices.bind(questionController))
);

router.put(
    "/edit/:question_id", (questionController.update.bind(questionController))
);


router.delete(
    "/delete/:question_id", (questionController.delete.bind(questionController))
);

export default router;
