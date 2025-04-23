import { users, type User, type InsertUser,
  disciplines, type Discipline, type InsertDiscipline,
  courses, type Course, type InsertCourse,
  courseDisciplines, type CourseDiscipline, type InsertCourseDiscipline,
  questions, type Question, type InsertQuestion,
  assessments, type Assessment, type InsertAssessment,
  assessmentQuestions, type AssessmentQuestion, type InsertAssessmentQuestion,
  institutions, type Institution, type InsertInstitution,
  polos, type Polo, type InsertPolo,
  financialTransactions, type FinancialTransaction, type InsertFinancialTransaction,
  financialCategories, type FinancialCategory, type InsertFinancialCategory,
  enrollments, type Enrollment, type InsertEnrollment,
  enrollmentStatusHistory, type EnrollmentStatusHistory, type InsertEnrollmentStatusHistory,
  // Novas entidades
  simplifiedEnrollments, type SimplifiedEnrollment, type InsertSimplifiedEnrollment,
  simplifiedEnrollmentStatusLog, type SimplifiedEnrollmentStatusLog, type InsertSimplifiedEnrollmentStatusLog,
} from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, or, like, asc, desc, gte, lte } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByPortalType(portalType: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Disciplinas
  getDiscipline(id: number): Promise<Discipline | undefined>;
  getDisciplineByCode(code: string): Promise<Discipline | undefined>;
  getDisciplines(search?: string, limit?: number, offset?: number): Promise<Discipline[]>;
  createDiscipline(discipline: InsertDiscipline): Promise<Discipline>;
  updateDiscipline(id: number, discipline: Partial<InsertDiscipline>): Promise<Discipline | undefined>;
  deleteDiscipline(id: number): Promise<boolean>;
  updateDisciplineContent(id: number, contentData: Partial<InsertDiscipline>): Promise<Discipline | undefined>;
  checkDisciplineCompleteness(id: number): Promise<boolean>;
  
  // Cursos
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCourses(search?: string, status?: string, limit?: number, offset?: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  publishCourse(id: number): Promise<Course | undefined>;
  
  // Disciplinas em Cursos
  getCourseDisciplines(courseId: number): Promise<CourseDiscipline[]>;
  addDisciplineToCourse(courseDiscipline: InsertCourseDiscipline): Promise<CourseDiscipline>;
  removeDisciplineFromCourse(courseId: number, disciplineId: number): Promise<boolean>;
  reorderCourseDisciplines(courseId: number, disciplineOrder: { disciplineId: number, order: number }[]): Promise<boolean>;
  
  // Questões
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByDiscipline(disciplineId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Avaliações
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByDiscipline(disciplineId: number, type?: string): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Questões em Avaliações
  getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]>;
  addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  removeQuestionFromAssessment(assessmentId: number, questionId: number): Promise<boolean>;
  reorderAssessmentQuestions(assessmentId: number, questionOrder: { questionId: number, order: number }[]): Promise<boolean>;
  
  // Instituições
  getInstitution(id: number): Promise<Institution | undefined>;
  getInstitutionByCode(code: string): Promise<Institution | undefined>;
  getInstitutionByCNPJ(cnpj: string): Promise<Institution | undefined>;
  getInstitutions(search?: string, status?: string, limit?: number, offset?: number): Promise<Institution[]>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: number, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;
  deleteInstitution(id: number): Promise<boolean>;
  
  // Polos
  getPolo(id: number): Promise<Polo | undefined>;
  getPoloByCode(code: string): Promise<Polo | undefined>;
  getPoloByUserId(userId: number): Promise<Polo | undefined>;
  getPolos(search?: string, status?: string, institutionId?: number, limit?: number, offset?: number): Promise<Polo[]>;
  createPolo(polo: InsertPolo): Promise<Polo>;
  updatePolo(id: number, polo: Partial<InsertPolo>): Promise<Polo | undefined>;
  deletePolo(id: number): Promise<boolean>;
  
  // Transações Financeiras
  getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined>;
  getFinancialTransactions(
    type?: string, 
    category?: string, 
    search?: string, 
    startDate?: Date, 
    endDate?: Date, 
    institutionId?: number,
    limit?: number, 
    offset?: number
  ): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  
  // Categorias Financeiras
  getFinancialCategory(id: number): Promise<FinancialCategory | undefined>;
  getFinancialCategories(type?: string, institutionId?: number, limit?: number, offset?: number): Promise<FinancialCategory[]>;
  createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory>;
  updateFinancialCategory(id: number, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined>;
  deleteFinancialCategory(id: number): Promise<boolean>;
  
  // Matrículas
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentByCode(code: string): Promise<Enrollment | undefined>;
  getEnrollments(
    search?: string, 
    status?: string, 
    studentId?: number,
    courseId?: number,
    poloId?: number,
    institutionId?: number,
    partnerId?: number,
    startDate?: Date,
    endDate?: Date,
    paymentGateway?: string,
    limit?: number, 
    offset?: number
  ): Promise<Enrollment[]>;
  getStudentEnrollments(studentId: number): Promise<Enrollment[]>;
  getCourseEnrollments(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  updateEnrollmentStatus(id: number, status: string, reason?: string, changedById?: number, metadata?: any): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Histórico de Status de Matrículas
  getEnrollmentStatusHistory(enrollmentId: number): Promise<EnrollmentStatusHistory[]>;
  addEnrollmentStatusHistory(historyEntry: InsertEnrollmentStatusHistory): Promise<EnrollmentStatusHistory>;
  
  // Matrículas Simplificadas
  getSimplifiedEnrollment(id: number): Promise<SimplifiedEnrollment | undefined>;
  getSimplifiedEnrollments(
    search?: string,
    status?: string,
    institutionId?: number,
    courseId?: number,
    poloId?: number,
    limit?: number,
    offset?: number
  ): Promise<SimplifiedEnrollment[]>;
  createSimplifiedEnrollment(enrollment: InsertSimplifiedEnrollment): Promise<SimplifiedEnrollment>;
  updateSimplifiedEnrollment(id: number, enrollment: Partial<InsertSimplifiedEnrollment>): Promise<SimplifiedEnrollment | undefined>;
  updateSimplifiedEnrollmentStatus(id: number, status: string, reason?: string, changedById?: number, metadata?: any): Promise<SimplifiedEnrollment | undefined>;
  deleteSimplifiedEnrollment(id: number): Promise<boolean>;
  convertSimplifiedToFullEnrollment(id: number): Promise<Enrollment | undefined>;
  
  // Log de Status de Matrículas Simplificadas
  getSimplifiedEnrollmentStatusLog(enrollmentId: number): Promise<SimplifiedEnrollmentStatusLog[]>;
  addSimplifiedEnrollmentStatusLog(logEntry: InsertSimplifiedEnrollmentStatusLog): Promise<SimplifiedEnrollmentStatusLog>;
  
  // Gateway de pagamento
  createPaymentForEnrollment(enrollment: Enrollment, gateway: string): Promise<{externalId: string, paymentUrl: string}>;
  getPaymentStatus(externalId: string, gateway: string): Promise<string>;
  
  sessionStore: SessionStore;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // ==================== Usuários ====================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByPortalType(portalType: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.portalType, portalType));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // ==================== Disciplinas ====================
  async getDiscipline(id: number): Promise<Discipline | undefined> {
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.id, id));
    return discipline || undefined;
  }

  async getDisciplineByCode(code: string): Promise<Discipline | undefined> {
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.code, code));
    return discipline || undefined;
  }

  async getDisciplines(search?: string, limit: number = 50, offset: number = 0): Promise<Discipline[]> {
    let query = db.select().from(disciplines).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(disciplines.name, `%${search}%`),
          like(disciplines.code, `%${search}%`)
        )
      );
    }
    
    return await query.orderBy(asc(disciplines.name));
  }

  async createDiscipline(discipline: InsertDiscipline): Promise<Discipline> {
    const [newDiscipline] = await db
      .insert(disciplines)
      .values(discipline)
      .returning();
    return newDiscipline;
  }

  async updateDiscipline(id: number, discipline: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    const [updatedDiscipline] = await db
      .update(disciplines)
      .set(discipline)
      .where(eq(disciplines.id, id))
      .returning();
    return updatedDiscipline;
  }

  async deleteDiscipline(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(disciplines)
        .where(eq(disciplines.id, id))
        .returning({ id: disciplines.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting discipline:", error);
      return false;
    }
  }
  
  async updateDisciplineContent(id: number, contentData: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    return this.updateDiscipline(id, contentData);
  }
  
  async checkDisciplineCompleteness(id: number): Promise<boolean> {
    const discipline = await this.getDiscipline(id);
    if (!discipline) return false;
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    return Boolean(
      discipline.name && 
      discipline.description && 
      discipline.syllabus && 
      discipline.workload > 0
    );
  }
  
  // ==================== Cursos ====================
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }
  
  async getCourseByCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.code, code));
    return course || undefined;
  }
  
  async getCourses(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Course[]> {
    let query = db.select().from(courses).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(courses.name, `%${search}%`),
          like(courses.code, `%${search}%`),
          like(courses.description, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(courses.status, status));
    }
    
    return await query.orderBy(asc(courses.name));
  }
  
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(asc(courses.name));
  }
  
  async getPublishedCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.status, "published")).orderBy(asc(courses.name));
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }
  
  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(courses)
        .where(eq(courses.id, id))
        .returning({ id: courses.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting course:", error);
      return false;
    }
  }
  
  async publishCourse(id: number): Promise<Course | undefined> {
    const now = new Date();
    const [publishedCourse] = await db
      .update(courses)
      .set({ 
        status: "published", 
        publishedAt: now, 
        updatedAt: now 
      })
      .where(eq(courses.id, id))
      .returning();
    return publishedCourse;
  }
  
  // ==================== Disciplinas em Cursos ====================
  async getCourseDisciplines(courseId: number): Promise<CourseDiscipline[]> {
    return await db
      .select()
      .from(courseDisciplines)
      .where(eq(courseDisciplines.courseId, courseId))
      .orderBy(asc(courseDisciplines.order));
  }
  
  async addDisciplineToCourse(courseDiscipline: InsertCourseDiscipline): Promise<CourseDiscipline> {
    const [newCourseDiscipline] = await db
      .insert(courseDisciplines)
      .values(courseDiscipline)
      .returning();
    return newCourseDiscipline;
  }
  
  async removeDisciplineFromCourse(courseId: number, disciplineId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(courseDisciplines)
        .where(
          and(
            eq(courseDisciplines.courseId, courseId),
            eq(courseDisciplines.disciplineId, disciplineId)
          )
        )
        .returning({ id: courseDisciplines.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error removing discipline from course:", error);
      return false;
    }
  }
  
  async reorderCourseDisciplines(courseId: number, disciplineOrder: { disciplineId: number, order: number }[]): Promise<boolean> {
    try {
      // Implementação de reordenação em massa com transação
      // Esta é uma versão simplificada
      for (const item of disciplineOrder) {
        await db
          .update(courseDisciplines)
          .set({ order: item.order })
          .where(
            and(
              eq(courseDisciplines.courseId, courseId),
              eq(courseDisciplines.disciplineId, item.disciplineId)
            )
          );
      }
      return true;
    } catch (error) {
      console.error("Error reordering course disciplines:", error);
      return false;
    }
  }
  
  // ==================== Questões ====================
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }
  
  async getQuestionsByDiscipline(disciplineId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.disciplineId, disciplineId));
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }
  
  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(questions)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting question:", error);
      return false;
    }
  }
  
  // ==================== Avaliações ====================
  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }
  
  async getAssessmentsByDiscipline(disciplineId: number, type?: string): Promise<Assessment[]> {
    let query = db
      .select()
      .from(assessments)
      .where(eq(assessments.disciplineId, disciplineId));
    
    if (type) {
      query = query.where(eq(assessments.type, type));
    }
    
    return await query;
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }
  
  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set(assessment)
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }
  
  async deleteAssessment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning({ id: assessments.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return false;
    }
  }
  
  // ==================== Questões em Avaliações ====================
  async getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId))
      .orderBy(asc(assessmentQuestions.order));
  }
  
  async addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [newAssessmentQuestion] = await db
      .insert(assessmentQuestions)
      .values(assessmentQuestion)
      .returning();
    return newAssessmentQuestion;
  }
  
  async removeQuestionFromAssessment(assessmentId: number, questionId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessmentQuestions)
        .where(
          and(
            eq(assessmentQuestions.assessmentId, assessmentId),
            eq(assessmentQuestions.questionId, questionId)
          )
        )
        .returning({ id: assessmentQuestions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error removing question from assessment:", error);
      return false;
    }
  }
  
  async reorderAssessmentQuestions(assessmentId: number, questionOrder: { questionId: number, order: number }[]): Promise<boolean> {
    try {
      // Implementação de reordenação em massa com transação
      // Esta é uma versão simplificada
      for (const item of questionOrder) {
        await db
          .update(assessmentQuestions)
          .set({ order: item.order })
          .where(
            and(
              eq(assessmentQuestions.assessmentId, assessmentId),
              eq(assessmentQuestions.questionId, item.questionId)
            )
          );
      }
      return true;
    } catch (error) {
      console.error("Error reordering assessment questions:", error);
      return false;
    }
  }
  
  // ==================== Instituições ====================
  async getInstitution(id: number): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }
  
  async getInstitutionByCode(code: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.code, code));
    return institution || undefined;
  }
  
  async getInstitutionByCNPJ(cnpj: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.cnpj, cnpj));
    return institution || undefined;
  }
  
  async getInstitutions(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Institution[]> {
    let query = db.select().from(institutions).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(institutions.name, `%${search}%`),
          like(institutions.code, `%${search}%`),
          like(institutions.cnpj, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(institutions.status, status));
    }
    
    return await query.orderBy(asc(institutions.name));
  }
  
  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db
      .insert(institutions)
      .values(institution)
      .returning();
    return newInstitution;
  }
  
  async updateInstitution(id: number, institution: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [updatedInstitution] = await db
      .update(institutions)
      .set(institution)
      .where(eq(institutions.id, id))
      .returning();
    return updatedInstitution;
  }
  
  async deleteInstitution(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(institutions)
        .where(eq(institutions.id, id))
        .returning({ id: institutions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting institution:", error);
      return false;
    }
  }
  
  // ==================== Polos ====================
  async getPolo(id: number): Promise<Polo | undefined> {
    const [polo] = await db.select().from(polos).where(eq(polos.id, id));
    return polo || undefined;
  }
  
  async getPoloByCode(code: string): Promise<Polo | undefined> {
    const [polo] = await db.select().from(polos).where(eq(polos.code, code));
    return polo || undefined;
  }
  
  async getPoloByUserId(userId: number): Promise<Polo | undefined> {
    const user = await this.getUser(userId);
    if (!user || user.portalType !== "polo" || !user.poloId) {
      return undefined;
    }
    return await this.getPolo(user.poloId);
  }
  
  async getPolos(search?: string, status?: string, institutionId?: number, limit: number = 50, offset: number = 0): Promise<Polo[]> {
    let query = db.select().from(polos).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(polos.name, `%${search}%`),
          like(polos.code, `%${search}%`),
          like(polos.managerName, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(polos.status, status));
    }
    
    if (institutionId) {
      query = query.where(eq(polos.institutionId, institutionId));
    }
    
    return await query.orderBy(asc(polos.name));
  }
  
  async createPolo(polo: InsertPolo): Promise<Polo> {
    const [newPolo] = await db
      .insert(polos)
      .values(polo)
      .returning();
    return newPolo;
  }
  
  async updatePolo(id: number, polo: Partial<InsertPolo>): Promise<Polo | undefined> {
    const [updatedPolo] = await db
      .update(polos)
      .set(polo)
      .where(eq(polos.id, id))
      .returning();
    return updatedPolo;
  }
  
  async deletePolo(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(polos)
        .where(eq(polos.id, id))
        .returning({ id: polos.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting polo:", error);
      return false;
    }
  }
  
  // ==================== Transações Financeiras ====================
  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    return transaction || undefined;
  }
  
  async getFinancialTransactions(
    type?: string, 
    category?: string, 
    search?: string, 
    startDate?: Date, 
    endDate?: Date, 
    institutionId?: number,
    limit: number = 50, 
    offset: number = 0
  ): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions).limit(limit).offset(offset);
    
    if (type) {
      query = query.where(eq(financialTransactions.type, type));
    }
    
    if (category) {
      query = query.where(eq(financialTransactions.category, category));
    }
    
    if (search) {
      query = query.where(like(financialTransactions.description, `%${search}%`));
    }
    
    if (startDate) {
      query = query.where(gte(financialTransactions.date, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(financialTransactions.date, endDate));
    }
    
    if (institutionId) {
      query = query.where(eq(financialTransactions.institutionId, institutionId));
    }
    
    return await query.orderBy(desc(financialTransactions.date));
  }
  
  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [newTransaction] = await db
      .insert(financialTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
  
  async updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(financialTransactions)
      .set(transaction)
      .where(eq(financialTransactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async deleteFinancialTransaction(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(financialTransactions)
        .where(eq(financialTransactions.id, id))
        .returning({ id: financialTransactions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting financial transaction:", error);
      return false;
    }
  }
  
  // ==================== Categorias Financeiras ====================
  async getFinancialCategory(id: number): Promise<FinancialCategory | undefined> {
    const [category] = await db.select().from(financialCategories).where(eq(financialCategories.id, id));
    return category || undefined;
  }
  
  async getFinancialCategories(type?: string, institutionId?: number, limit: number = 50, offset: number = 0): Promise<FinancialCategory[]> {
    let query = db.select().from(financialCategories).limit(limit).offset(offset);
    
    if (type) {
      query = query.where(eq(financialCategories.type, type));
    }
    
    if (institutionId) {
      query = query.where(eq(financialCategories.institutionId, institutionId));
    }
    
    return await query.orderBy(asc(financialCategories.name));
  }
  
  async createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory> {
    const [newCategory] = await db
      .insert(financialCategories)
      .values(category)
      .returning();
    return newCategory;
  }
  
  async updateFinancialCategory(id: number, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined> {
    const [updatedCategory] = await db
      .update(financialCategories)
      .set(category)
      .where(eq(financialCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteFinancialCategory(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(financialCategories)
        .where(eq(financialCategories.id, id))
        .returning({ id: financialCategories.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting financial category:", error);
      return false;
    }
  }
  
  // ==================== Matrículas ====================
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment || undefined;
  }
  
  async getEnrollmentByCode(code: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.code, code));
    return enrollment || undefined;
  }
  
  async getEnrollments(
    search?: string, 
    status?: string, 
    studentId?: number,
    courseId?: number,
    poloId?: number,
    institutionId?: number,
    partnerId?: number,
    startDate?: Date,
    endDate?: Date,
    paymentGateway?: string,
    limit: number = 50, 
    offset: number = 0
  ): Promise<Enrollment[]> {
    let query = db.select().from(enrollments).limit(limit).offset(offset);
    
    // Filtros
    if (search) {
      query = query.where(
        or(
          like(enrollments.code, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(enrollments.status, status));
    }
    
    if (studentId) {
      query = query.where(eq(enrollments.studentId, studentId));
    }
    
    if (courseId) {
      query = query.where(eq(enrollments.courseId, courseId));
    }
    
    if (poloId) {
      query = query.where(eq(enrollments.poloId, poloId));
    }
    
    if (institutionId) {
      query = query.where(eq(enrollments.institutionId, institutionId));
    }
    
    if (partnerId) {
      query = query.where(eq(enrollments.partnerId, partnerId));
    }
    
    if (startDate) {
      query = query.where(gte(enrollments.enrollmentDate, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(enrollments.enrollmentDate, endDate));
    }
    
    if (paymentGateway) {
      query = query.where(eq(enrollments.paymentGateway, paymentGateway));
    }
    
    return await query.orderBy(desc(enrollments.enrollmentDate));
  }
  
  async getStudentEnrollments(studentId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.enrollmentDate));
  }
  
  async getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.enrollmentDate));
  }
  
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db
      .insert(enrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }
  
  async updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }
  
  async updateEnrollmentStatus(id: number, status: string, reason?: string, changedById?: number, metadata?: any): Promise<Enrollment | undefined> {
    // Pegar o status anterior
    const oldEnrollment = await this.getEnrollment(id);
    if (!oldEnrollment) return undefined;
    
    // Atualizar o status, removendo campos problemáticos relacionados a chaves estrangeiras
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ 
        status: status,
        updatedAt: new Date()
        // Removido updatedById para evitar erro de chave estrangeira
      })
      .where(eq(enrollments.id, id))
      .returning();
    
    // Registrar no histórico (com try-catch para evitar que falhas aqui interrompam o processamento)
    try {
      await this.addEnrollmentStatusHistory({
        enrollmentId: id,
        previousStatus: oldEnrollment.status,
        newStatus: status,
        changeReason: reason || "",
        changedById: undefined, // Usando undefined para evitar erro de chave estrangeira
        metadata: metadata || {}
      });
    } catch (historyError) {
      console.warn('Erro ao registrar histórico de status, mas o status foi atualizado:', historyError);
    }
    
    return updatedEnrollment;
  }
  
  async deleteEnrollment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(enrollments)
        .where(eq(enrollments.id, id))
        .returning({ id: enrollments.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      return false;
    }
  }
  
  // ==================== Histórico de Status de Matrículas ====================
  async getEnrollmentStatusHistory(enrollmentId: number): Promise<EnrollmentStatusHistory[]> {
    return await db
      .select()
      .from(enrollmentStatusHistory)
      .where(eq(enrollmentStatusHistory.enrollmentId, enrollmentId))
      .orderBy(desc(enrollmentStatusHistory.changeDate));
  }
  
  async addEnrollmentStatusHistory(historyEntry: InsertEnrollmentStatusHistory): Promise<EnrollmentStatusHistory> {
    const [newHistoryEntry] = await db
      .insert(enrollmentStatusHistory)
      .values(historyEntry)
      .returning();
    return newHistoryEntry;
  }
  
  // ==================== Matrículas Simplificadas ====================
  async getSimplifiedEnrollment(id: number): Promise<SimplifiedEnrollment | undefined> {
    const [enrollment] = await db.select().from(simplifiedEnrollments).where(eq(simplifiedEnrollments.id, id));
    return enrollment || undefined;
  }
  
  async getSimplifiedEnrollments(
    search?: string,
    status?: string,
    institutionId?: number,
    courseId?: number,
    poloId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<SimplifiedEnrollment[]> {
    try {
      console.log('Storage: Iniciando consulta de matrículas simplificadas');
      console.log('Parâmetros da consulta:', { search, status, institutionId, courseId, poloId, limit, offset });
      
      let query = db.select().from(simplifiedEnrollments).limit(limit).offset(offset);
      
      // Filtros
      if (search) {
        console.log('Aplicando filtro de pesquisa:', search);
        query = query.where(
          or(
            like(simplifiedEnrollments.studentName, `%${search}%`),
            like(simplifiedEnrollments.studentEmail, `%${search}%`),
            like(simplifiedEnrollments.studentCpf, `%${search}%`)
          )
        );
      }
      
      if (status) {
        console.log('Aplicando filtro de status:', status);
        query = query.where(eq(simplifiedEnrollments.status, status));
      }
      
      if (institutionId) {
        console.log('Aplicando filtro de instituição:', institutionId);
        query = query.where(eq(simplifiedEnrollments.institutionId, institutionId));
      }
      
      if (courseId) {
        console.log('Aplicando filtro de curso:', courseId);
        query = query.where(eq(simplifiedEnrollments.courseId, courseId));
      }
      
      if (poloId) {
        console.log('Aplicando filtro de polo:', poloId);
        query = query.where(eq(simplifiedEnrollments.poloId, poloId));
      }
      
      console.log('Executando consulta final...');
      const result = await query.orderBy(desc(simplifiedEnrollments.createdAt));
      console.log(`Consulta bem-sucedida, retornando ${result ? result.length : 0} registros`);
      
      return result;
    } catch (error) {
      console.error('ERRO na consulta de matrículas simplificadas:', error);
      throw error;
    }
  }
  
  async createSimplifiedEnrollment(enrollment: InsertSimplifiedEnrollment): Promise<SimplifiedEnrollment> {
    const [newEnrollment] = await db
      .insert(simplifiedEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }
  
  async updateSimplifiedEnrollment(id: number, enrollment: Partial<InsertSimplifiedEnrollment>): Promise<SimplifiedEnrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(simplifiedEnrollments)
      .set(enrollment)
      .where(eq(simplifiedEnrollments.id, id))
      .returning();
    return updatedEnrollment;
  }
  
  async updateSimplifiedEnrollmentStatus(id: number, status: string, reason?: string, changedById?: number, metadata?: any): Promise<SimplifiedEnrollment | undefined> {
    // Pegar o status anterior
    const oldEnrollment = await this.getSimplifiedEnrollment(id);
    if (!oldEnrollment) return undefined;
    
    // Adicionar datas específicas com base no status
    const updateData: Partial<InsertSimplifiedEnrollment> = { 
      status: status,
      updatedAt: new Date()
      // Removido updatedById para evitar erro de chave estrangeira
    };
    
    // Adicionar datas específicas baseadas no status
    const now = new Date();
    if (status === 'waiting_payment') {
      updateData.paymentDueDate = now;
    } else if (status === 'payment_confirmed') {
      updateData.paymentConfirmedAt = now;
    } else if (status === 'blocked') {
      updateData.blockExecutedAt = now;
    } else if (status === 'cancelled') {
      updateData.cancellationExecutedAt = now;
    }
    
    // Atualizar o status
    const [updatedEnrollment] = await db
      .update(simplifiedEnrollments)
      .set(updateData)
      .where(eq(simplifiedEnrollments.id, id))
      .returning();
    
    // Registrar no histórico (com try-catch para evitar que falhas aqui interrompam o processamento)
    try {
      await this.addSimplifiedEnrollmentStatusLog({
        enrollmentId: id,
        previousStatus: oldEnrollment.status,
        newStatus: status,
        changeReason: reason || "",
        changedById: undefined, // Usando undefined para evitar erro de chave estrangeira
        metadata: metadata || {}
      });
    } catch (historyError) {
      console.warn('Erro ao registrar histórico de status simplificado, mas o status foi atualizado:', historyError);
    }
    
    return updatedEnrollment;
  }
  
  async deleteSimplifiedEnrollment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(simplifiedEnrollments)
        .where(eq(simplifiedEnrollments.id, id))
        .returning({ id: simplifiedEnrollments.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting simplified enrollment:", error);
      return false;
    }
  }
  
  // Método para conversão de matrícula simplificada para completa
  async convertSimplifiedToFullEnrollment(id: number): Promise<Enrollment | undefined> {
    const simplified = await this.getSimplifiedEnrollment(id);
    if (!simplified) {
      return undefined;
    }
    
    // Verificar se já foi convertido
    if (simplified.convertedEnrollmentId) {
      return this.getEnrollment(simplified.convertedEnrollmentId);
    }
    
    // Verificar se existe um usuário com o mesmo email
    let user = await this.getUserByEmail(simplified.studentEmail);
    
    // Se não existir, criar um novo usuário
    if (!user) {
      // Gerar um username único baseado no email
      const username = simplified.studentEmail.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Gerar uma senha aleatória temporária (deverá ser alterada pelo usuário)
      const tempPassword = Math.random().toString(36).slice(-8);
      
      user = await this.createUser({
        username: username,
        password: tempPassword, // Na prática, você deve hashear isso
        fullName: simplified.studentName,
        email: simplified.studentEmail,
        cpf: simplified.studentCpf || null,
        phone: simplified.studentPhone || null,
        portalType: "student"
      });
    }
    
    // Criar a matrícula completa
    const newEnrollment = await this.createEnrollment({
      code: `MAT${Date.now().toString().substring(0, 10)}`,
      studentId: user.id,
      courseId: simplified.courseId,
      poloId: simplified.poloId || null,
      institutionId: simplified.institutionId,
      partnerId: null,
      amount: simplified.amount || 0,
      paymentGateway: simplified.paymentGateway || "asaas",
      paymentExternalId: simplified.paymentId || null,
      paymentUrl: simplified.paymentUrl || null,
      status: "active", // A matrícula é convertida como ativa
      sourceChannel: simplified.sourceChannel || "admin_portal",
      createdById: simplified.createdById || null,
      enrollmentDate: new Date()
    });
    
    // Atualizar a matrícula simplificada
    await this.updateSimplifiedEnrollment(id, {
      status: "converted",
      convertedEnrollmentId: newEnrollment.id,
      processedAt: new Date(),
      processedById: simplified.createdById || null
    });
    
    return newEnrollment;
  }
  
  // ==================== Log de Status de Matrículas Simplificadas ====================
  async getSimplifiedEnrollmentStatusLog(enrollmentId: number): Promise<SimplifiedEnrollmentStatusLog[]> {
    return await db
      .select()
      .from(simplifiedEnrollmentStatusLog)
      .where(eq(simplifiedEnrollmentStatusLog.enrollmentId, enrollmentId))
      .orderBy(desc(simplifiedEnrollmentStatusLog.changeDate));
  }
  
  async addSimplifiedEnrollmentStatusLog(logEntry: InsertSimplifiedEnrollmentStatusLog): Promise<SimplifiedEnrollmentStatusLog> {
    const [newLogEntry] = await db
      .insert(simplifiedEnrollmentStatusLog)
      .values(logEntry)
      .returning();
    return newLogEntry;
  }
  
  // ==================== Gateway de Pagamento ====================
  async createPaymentForEnrollment(enrollment: Enrollment, gateway: string): Promise<{externalId: string, paymentUrl: string}> {
    // Esta é uma implementação fictícia. Na prática, você integraria com um gateway real.
    return {
      externalId: `pay_${Math.random().toString(36).substring(2, 15)}`,
      paymentUrl: `https://example.com/pay/${Math.random().toString(36).substring(2, 15)}`
    };
  }
  
  async getPaymentStatus(externalId: string, gateway: string): Promise<string> {
    // Esta é uma implementação fictícia. Na prática, você consultaria o gateway.
    return "completed";
  }
}

export const storage = new DatabaseStorage();