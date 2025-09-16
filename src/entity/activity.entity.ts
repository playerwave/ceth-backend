import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Assessment } from "./assessment/assessment.entity";
import { AssessmentVersion } from "./assessment/versioning assessment/assessment-version.entity";
import { ActivityFood } from "./activity.food.entity";
import { ActivityDetail } from "./activitydetail.entity";
import { Room } from "./room.entity";
import { Certificate } from "./certificate/certificate.entity";
import { QRCode } from "./qr-code.entity";

@Entity()
@Index("IDX_ACTIVITY_NAME_ACTIVITY", ["activity_name"])
@Index("IDX_PRESENTTER_COMPANY_NAME_ACTIVITY", ["presenter_company_name"])
@Index("IDX_TYPE_ACTIVITY", ["type"])
@Index("IDX_DESCRIPTION_ACTIVITY_ACTIVITY", ["description"])
@Index("IDX_SEAT_ACTIVITY", ["seat"])
@Index("IDX_RECIEVE_HOURS_ACTIVITY", ["recieve_hours"])
@Index("IDX_EVENT_FORMAT_ACTIVITY", ["event_format"])
@Index("IDX_CREATE_ACTIVITY_DATE_ACTIVITY", ["create_activity_date"])
@Index("IDX_SPECIAL_START_REGISTER_DATE_ACTIVITY", [
  "special_start_register_date",
])
@Index("IDX_START_REGISTER_DATE_ACTIVITY", ["start_register_date"])
@Index("IDX_END_REGISTER_DATE_ACTIVITY", ["end_register_date"])
@Index("IDX_START_ACTIVITY_DATE_ACTIVITY", ["start_activity_date"])
@Index("IDX_END_ACTIVITY_DATE_ACTIVITY", ["end_activity_date"])
@Index("IDX_IMAGE_URL_ACTIVITY", ["image_url"])
@Index("IDX_ACTIVITY_STATUS_ACTIVITY", ["activity_status"])
@Index("IDX_ACTIVITY_STATE_ACTIVITY", ["activity_state"])
@Index("IDX_STATUS_ACTIVITY_ACTIVITY", ["status"])
@Index("IDX_LAST_UPDATE_ACTIVITY_DATE_ACTIVITY", ["last_update_activity_date"])
@Index("IDX_URL_ACTIVITY", ["url"])
@Index("IDX_ROOM_ID_ACTIVITY", ["room_id"])
@Index("IDX_ASSESSMENT_ID_ACTIVITY", ["assessment_id"])
@Index("IDX_ASSESSMENT_VERSION_ID_ACTIVITY", ["assessment_version_id"])
@Index("IDX_START_ASSESSMENT_ACTIVITY", ["start_assessment"])
@Index("IDX_END_ASSESSMENT_ACTIVITY", ["end_assessment"])
@Index("IDX_REGISTERED_COUNT_ACTIVITY", ["registered_count"])
export class Activity {
  @PrimaryGeneratedColumn()
  activity_id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  activity_name?: string | null;

  @Column({ type: "varchar", length: 255 })
  presenter_company_name?: string;

  @Column({
    type: "enum",
    enum: ["Soft", "Hard"],
  })
  type?: "Soft" | "Hard";

  @Column({ type: "text" })
  description?: string;

  @Column({ type: "int" })
  seat?: number;

  @Column({ type: "int" })
  recieve_hours?: number;

  @Column({
    type: "enum",
    enum: ["Online", "Onsite", "Course"],
  })
  event_format?: "Online" | "Onsite" | "Course";

  @Column({ type: "timestamp" })
  create_activity_date?: Date;

  @Column({ type: "timestamp" , nullable: true })
  special_start_register_date?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  start_register_date?: Date | null ;

  @Column({ type: "timestamp", nullable: true })
  end_register_date?: Date | null;

  @Column({ type: "timestamp" })
  start_activity_date?: Date;

  @Column({ type: "timestamp" })
  end_activity_date?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  image_url?: string;

  @Column({
    type: "enum",
    enum: ["Private", "Public"],
    default: "Private",
  })
  activity_status?: "Private" | "Public";

  @Column({
    type: "enum",
    enum: [
      "Not Start",
      "Special Open Register",
      "Open Register",
      "Close Register",
      "Start Activity",
      "End Activity",
      "Start Assessment",
      "End Assessment",
    ],
    default: "Not Start",
  })
  activity_state?:
    | "Not Start"
    | "Special Open Register"
    | "Open Register"
    | "Close Register"
    | "Start Activity"
    | "End Activity"
    | "Start Assessment"
    | "End Assessment";

  @Column({
    type: "enum",
    enum: ["Active", "Inactive"],
    default: "Inactive",
  })
  status?: "Active" | "Inactive";

  @Column({ type: "timestamp" })
  last_update_activity_date?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  url?: string | null;

  @ManyToOne(() => Room, (room) => room.activity)
  @JoinColumn({ name: "room_id" })
  room?: Room;

  @Column({ type: "int", nullable: true })
  room_id?: number | null;

  @ManyToOne(() => Assessment, (assessment) => assessment.activity)
  @JoinColumn({ name: "assessment_id" })
  assessment?: Assessment;

  @Column({ type: "int", nullable: true })
  assessment_id?: number | null;

  @ManyToOne(() => AssessmentVersion, (version) => version.activities)
  @JoinColumn({ name: "assessment_version_id" })
  assessmentVersion?: AssessmentVersion;

  @Column({ type: "int", nullable: true })
  assessment_version_id?: number | null;

  @Column({ type: "timestamp", nullable: true })
  start_assessment?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  end_assessment?: Date | null;

  @Column({ type: "int", nullable: true, default: 0 })
  registered_count?: number | null;

  @OneToMany(() => ActivityFood, (activityFood) => activityFood.activity)
  activityFood?: ActivityFood[];

  @OneToMany(() => ActivityDetail, (activityDetail) => activityDetail.activity)
  activityDetail?: ActivityDetail[];

  @OneToMany(() => Certificate, (certificate) => certificate.activity)
  certificate?: Certificate[];

  @OneToMany(() => QRCode, (qrCode) => qrCode.activity)
  qrCodes?: QRCode[];
}
