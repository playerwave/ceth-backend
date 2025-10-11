import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { StudentExcelData } from './fileProcessingUtils';
import { RiskCalculator, RiskCalculationInput } from './riskCalculator';
import path from 'path';

// ✅ Worker Thread สำหรับประมวลผลข้อมูลแบบ parallel
if (!isMainThread && parentPort) {
  const { 
    studentData, 
    userMap, 
    gradeMap, 
    departmentMap, 
    eventCoopMap 
  } = workerData;

  try {
    const processedStudents = [];
    
    for (const data of studentData) {
      const user = userMap.get(data.code);
      if (!user) continue;
      
      // Split names
      const fullName = data.name;
      const engName = data.engName;
      
      // Split Thai name
      const thaiNameParts = fullName.split(' ');
      const thaiFirstName = thaiNameParts[0] || '';
      const thaiLastName = thaiNameParts.slice(1).join(' ') || '';
      
      // Split English name
      const engNameParts = engName.split(' ');
      const engFirstName = engNameParts[0] || '';
      const engLastName = engNameParts.slice(1).join(' ') || '';
      
      // Get grade_id from cache
      const gradeId = gradeMap.get(user.username.substring(0, 2)) || 1;
      
      // Get department_id from cache
      const departmentId = departmentMap.get(data.major) || 1;
      
      // Calculate hours
      let softHours = 0;
      let hardHours = 0;
      const isGrade1Or2 = gradeId === 1 || gradeId === 2;
      
      if (!isGrade1Or2) {
        softHours = data.softSkill ?? 0;
        hardHours = data.hardSkill ?? 0;
      }
      
      // Calculate risk
      const eventCoopKey = `${gradeId}_${departmentId}`;
      const eventCoop = eventCoopMap.get(eventCoopKey);
      
      let riskStatus: 'Normal' | 'Risk' = 'Normal';
      let riskPercentage = 0;
      
      if (eventCoop && eventCoop.is_on_coop) {
        const riskInput: RiskCalculationInput = {
          hardCurrent: hardHours,
          softCurrent: softHours,
          daysLeft: eventCoop.remaining_days || 0,
          isOnCoop: eventCoop.is_on_coop
        };
        
        const riskResult = RiskCalculator.calculateRisk(riskInput);
        riskStatus = riskResult.riskStatus;
        riskPercentage = riskResult.riskPercent;
      }
      
      // Create student object
      const student = {
        first_name_tha: thaiFirstName,
        last_name_tha: thaiLastName,
        first_name_eng: engFirstName,
        last_name_eng: engLastName,
        users_id: user.users_id,
        department_id: departmentId,
        soft_hours: softHours,
        hard_hours: hardHours,
        status: "Active" as const,
        faculty_id: 1,
        email: `${user.username}@go.buu.ac.th`,
        risk_status: riskStatus,
        risk_percentage: Math.round(riskPercentage),
        education_status: "Studying" as const,
        grade_id: gradeId,
      };
      
      processedStudents.push(student);
    }
    
    parentPort?.postMessage({ success: true, data: processedStudents });
  } catch (error) {
    parentPort?.postMessage({ success: false, error: error.message });
  }
}

// ✅ Main Thread Class
export class ParallelProcessor {
  private static readonly WORKER_COUNT = 4; // จำนวน worker threads
  
  // ✅ แบ่งข้อมูลเป็น chunks สำหรับ worker threads
  private static chunkArray<T>(array: T[], chunkCount: number): T[][] {
    const chunks: T[][] = [];
    const chunkSize = Math.ceil(array.length / chunkCount);
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
  
  // ✅ ประมวลผลข้อมูลแบบ parallel
  static async processStudentsInParallel(
    studentData: StudentExcelData[],
    userMap: Map<string, any>,
    gradeMap: Map<string, number>,
    departmentMap: Map<string, number>,
    eventCoopMap: Map<string, any>
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (studentData.length === 0) {
        resolve([]);
        return;
      }
      
      // แบ่งข้อมูลเป็น chunks
      const chunks = this.chunkArray(studentData, this.WORKER_COUNT);
      const workers: Worker[] = [];
      let completedWorkers = 0;
      const results: any[] = [];
      
      // สร้าง worker threads
      chunks.forEach((chunk, index) => {
        if (chunk.length === 0) return;
        
        const worker = new Worker(__filename, {
          workerData: {
            studentData: chunk,
            userMap: Array.from(userMap.entries()),
            gradeMap: Array.from(gradeMap.entries()),
            departmentMap: Array.from(departmentMap.entries()),
            eventCoopMap: Array.from(eventCoopMap.entries())
          }
        });
        
        worker.on('message', (message) => {
          if (message.success) {
            results.push(...message.data);
          } else {
            console.error(`Worker ${index} error:`, message.error);
          }
          
          completedWorkers++;
          if (completedWorkers === chunks.length) {
            // Terminate all workers
            workers.forEach(w => w.terminate());
            resolve(results);
          }
        });
        
        worker.on('error', (error) => {
          console.error(`Worker ${index} error:`, error);
          completedWorkers++;
          
          if (completedWorkers === chunks.length) {
            workers.forEach(w => w.terminate());
            reject(error);
          }
        });
        
        workers.push(worker);
      });
      
      // ถ้าไม่มี chunks ให้ resolve ทันที
      if (chunks.length === 0) {
        resolve([]);
      }
    });
  }
  
  // ✅ Batch hash passwords แบบ parallel
  static async batchHashPasswords(usernames: string[]): Promise<Map<string, string>> {
    const bcrypt = require('bcryptjs');
    const passwordMap = new Map<string, string>();
    
    // แบ่งเป็น chunks สำหรับ parallel processing
    const chunks = this.chunkArray(usernames, this.WORKER_COUNT);
    
    const hashPromises = chunks.map(async (chunk) => {
      const chunkResults = new Map<string, string>();
      
      for (const username of chunk) {
        const hashedPassword = await bcrypt.hash(`std_${username}`, 10);
        chunkResults.set(username, hashedPassword);
      }
      
      return chunkResults;
    });
    
    const results = await Promise.all(hashPromises);
    
    // รวมผลลัพธ์
    results.forEach(result => {
      result.forEach((password, username) => {
        passwordMap.set(username, password);
      });
    });
    
    return passwordMap;
  }
}
