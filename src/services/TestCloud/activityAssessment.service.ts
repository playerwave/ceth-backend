import { ActivityAssessmentDao } from "../../daos/TestCloud/activityAssessment.dao";
import { ActivityAssessment } from "../../entity/ActivityAssessment";
export class ActivityAssessmentService {
  private activityAssessmentDao = new ActivityAssessmentDao();

  async getActivityAssessment(): Promise<ActivityAssessment[]> {
    return await this.activityAssessmentDao.getActivityAssessment();
  }
}
