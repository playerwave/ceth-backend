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


// // ✅ POST เพิ่มตึก
// router.post(
//     "/add",
//     verifyToken,
//     Admin,
//     validateDTO(CreateQuestionDto),
//     wrapAsync(questionController.create.bind(questionController))
// );

// // ✅ PUT แก้ไขชื่อตึก
// router.put(
//     "/edit/:question_id",
//     verifyToken,
//     Admin,
//     validateDTO(UpdateQuestionDto),
//     wrapAsync(questionController.update.bind(questionController))
// );

// // ✅ DELETE ลบตึก
// router.delete(
//     "/delete/:question_id",
//     verifyToken,
//     Admin,
//     wrapAsync(questionController.delete.bind(questionController))
// );

export default router;
