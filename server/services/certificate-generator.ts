import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '../db';
import { certificates, certificateDisciplines, users, courses, certificateTemplates, certificateSigners, institutions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Interface para os dados do certificado
interface CertificateData {
  id: number;
  code: string;
  studentId: number;
  courseId?: number | null;
  courseName: string;
  totalHours: number;
  issueDate: Date;
  studentName: string;
  studentCpf?: string | null;
  studentBirthplace?: string | null;
  studentBirthDate?: string | null;
  completionDate?: Date | null;
  templateId?: number | null;
  signerId?: number | null;
  institutionId: number;
  institutionName?: string;
  institutionLogo?: string;
  signerName?: string;
  signerRole?: string;
  signerSignatureUrl?: string;
  disciplines?: Array<{
    name: string;
    workload: number;
    professorName?: string;
    professorTitle?: string;
    attendance?: number;
    performance?: number;
  }>;
}

// Função para obter os dados do certificado
export async function getCertificateData(certificateId: number): Promise<CertificateData> {
  // Buscar o certificado
  const certificate = await db.query.certificates.findFirst({
    where: eq(certificates.id, certificateId),
    with: {
      student: true,
      course: true,
      template: true,
      signer: true,
      institution: true,
      disciplines: {
        with: {
          discipline: true,
        },
      },
    },
  });

  if (!certificate) {
    throw new Error(`Certificado não encontrado: ${certificateId}`);
  }

  // Organizar os dados para o certificado
  const certData: CertificateData = {
    id: certificate.id,
    code: certificate.code,
    studentId: certificate.studentId,
    courseId: certificate.courseId,
    courseName: certificate.courseName || (certificate.course?.name || ''),
    totalHours: certificate.totalHours || 0,
    issueDate: certificate.issuedAt || new Date(),
    studentName: certificate.student?.fullName || '',
    studentCpf: certificate.student?.cpf || '',
    studentBirthplace: certificate.studentBirthplace || '',
    studentBirthDate: certificate.student?.birthDate || '',
    completionDate: certificate.completionDate || new Date(),
    templateId: certificate.templateId,
    signerId: certificate.signerId,
    institutionId: certificate.institutionId,
    institutionName: certificate.institution?.name || '',
    institutionLogo: certificate.institution?.logo || '',
    signerName: certificate.signer?.name || '',
    signerRole: certificate.signer?.role || '',
    signerSignatureUrl: certificate.signer?.signatureImageUrl || '',
    disciplines: certificate.disciplines.map(cd => ({
      name: cd.discipline?.name || cd.disciplineName || '',
      workload: cd.workload || cd.discipline?.workload || 0,
      professorName: cd.professorName || '',
      professorTitle: cd.professorTitle || '',
      attendance: cd.attendance || 0,
      performance: cd.performance || 0,
    })),
  };

  return certData;
}

// Função para gerar o QR Code
async function generateQRCode(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 1,
    scale: 4,
  });
}

// Função para gerar o certificado
export async function generateCertificatePdf(certificateId: number): Promise<Buffer> {
  const certificateData = await getCertificateData(certificateId);
  
  // Diretório para armazenar os certificados
  const certificatesDir = path.join(process.cwd(), 'uploads/certificates');
  
  // Garantir que o diretório exista
  try {
    await fs.mkdir(certificatesDir, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório para certificados:', error);
  }
  
  // Criar um buffer para armazenar o PDF
  const chunks: Buffer[] = [];
  
  // Criar um novo documento PDF
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: {
      Title: `Certificado - ${certificateData.studentName}`,
      Author: certificateData.institutionName,
      Subject: `Certificado de conclusão - ${certificateData.courseName}`,
      Keywords: 'certificado, conclusão, curso',
      CreationDate: new Date(),
    },
  });
  
  // Coletar os chunks do PDF à medida que são gerados
  doc.on('data', chunk => chunks.push(chunk));
  
  // Quando o documento for finalizado, resolver com o buffer completo
  const pdfBuffer = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
  });

  try {
    // Gerar o QR Code com a URL de validação
    const baseUrl = process.env.BASE_URL || 'https://portal.fadyc.com.br';
    const verificationUrl = `${baseUrl}/validar-certificado/${certificateData.code}`;
    const qrCodeBuffer = await generateQRCode(verificationUrl);
    
    // Background com degradê dourado
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f3e5ab');
    
    // Borda dourada mais escura
    const borderWidth = 20;
    doc.rect(borderWidth, borderWidth, doc.page.width - 2 * borderWidth, doc.page.height - 2 * borderWidth).stroke('#d4af37');
    
    // Logo da instituição
    const institutionLogoPath = certificateData.institutionLogo || path.join(process.cwd(), 'public/assets/certificates/institution-logo.svg');
    try {
      doc.image(institutionLogoPath, doc.page.width - 150, 30, { width: 120 });
    } catch (error) {
      console.error('Erro ao carregar logo da instituição, usando padrão:', error);
      try {
        doc.image(path.join(process.cwd(), 'public/assets/certificates/institution-logo.svg'), doc.page.width - 150, 30, { width: 120 });
      } catch (fallbackError) {
        console.error('Erro ao carregar logo padrão:', fallbackError);
      }
    }
    
    // QR Code para validação
    doc.image(qrCodeBuffer, doc.page.width - 150, doc.page.height - 150, { width: 100, height: 100 });
    
    // Selo/Brasão da instituição
    const sealPath = path.join(process.cwd(), 'public/assets/certificates/certificate-seal.svg');
    const sealSize = 100;
    try {
      doc.image(sealPath, 50, 50, { width: sealSize, height: sealSize });
    } catch (error) {
      console.error('Erro ao carregar selo/brasão da instituição:', error);
    }
    
    // Título principal
    doc.font('Helvetica-Bold').fontSize(32);
    doc.text('EDUNEXA ACADEMY', doc.page.width / 2, 80, { align: 'center' });
    
    // Subtítulo
    doc.fontSize(28);
    doc.text('CERTIFICADO', doc.page.width / 2, 130, { align: 'center' });
    
    // Introdução
    doc.font('Helvetica').fontSize(16);
    doc.text('Certificamos que', doc.page.width / 2, 180, { align: 'center' });
    
    // Nome do aluno
    doc.font('Helvetica-Bold').fontSize(28);
    doc.text(certificateData.studentName, doc.page.width / 2, 220, { align: 'center' });
    doc.moveTo(doc.page.width / 4, 260).lineTo(3 * doc.page.width / 4, 260).stroke();
    
    // Texto do certificado
    doc.font('Helvetica').fontSize(14);
    
    const certificateText = `concluiu com aproveitamento o curso de Pós-Graduação Lato Sensu em ${certificateData.courseName}, com carga horária de ${certificateData.totalHours} horas, tendo cumprido todas as exigências acadêmicas do curso, conforme legislação vigente.`;
    
    doc.text(certificateText, doc.page.width / 2, 280, {
      align: 'center',
      width: doc.page.width - 120,
      columns: 1,
    });
    
    // Dados do aluno
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(certificateData.studentName, doc.page.width / 4, doc.page.height - 100, { align: 'center' });
    
    // Descrição do aluno
    doc.font('Helvetica').fontSize(12);
    doc.text('Profissional', doc.page.width / 4, doc.page.height - 80, { align: 'center' });
    
    // Assinatura do Diretor
    if (certificateData.signerSignatureUrl) {
      try {
        doc.image(certificateData.signerSignatureUrl, 3 * doc.page.width / 4 - 50, doc.page.height - 150, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar imagem da assinatura no certificado, usando assinatura padrão:', error);
        try {
          // Usar assinatura padrão SVG
          doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), 3 * doc.page.width / 4 - 50, doc.page.height - 150, { width: 100 });
        } catch (fallbackError) {
          console.error('Erro ao carregar assinatura padrão no certificado, usando linha:', fallbackError);
          // Linha para assinatura manual
          doc.moveTo(3 * doc.page.width / 4 - 100, doc.page.height - 120).lineTo(3 * doc.page.width / 4 + 100, doc.page.height - 120).stroke();
        }
      }
    } else {
      try {
        // Usar assinatura padrão SVG
        doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), 3 * doc.page.width / 4 - 50, doc.page.height - 150, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar assinatura padrão no certificado:', error);
        // Linha para assinatura manual
        doc.moveTo(3 * doc.page.width / 4 - 100, doc.page.height - 120).lineTo(3 * doc.page.width / 4 + 100, doc.page.height - 120).stroke();
      }
    }
    
    // Dados do Diretor
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(certificateData.signerName || 'Ana Lúcia Moreira Gonçalves', 3 * doc.page.width / 4, doc.page.height - 100, { align: 'center' });
    
    // Cargo do Diretor
    doc.font('Helvetica').fontSize(12);
    doc.text(certificateData.signerRole || 'Diretora Adjunta', 3 * doc.page.width / 4, doc.page.height - 80, { align: 'center' });
    
    // Finalizar o documento
    doc.end();
    
    // Aguardar a geração completa do buffer
    return await pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF do certificado:', error);
    throw error;
  }
}

// Função para gerar o histórico escolar
export async function generateTranscriptPdf(certificateId: number): Promise<Buffer> {
  const certificateData = await getCertificateData(certificateId);
  
  // Criar um buffer para armazenar o PDF
  const chunks: Buffer[] = [];
  
  // Criar um novo documento PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Histórico Escolar - ${certificateData.studentName}`,
      Author: certificateData.institutionName,
      Subject: `Histórico Escolar - ${certificateData.courseName}`,
      Keywords: 'histórico, escolar, certificado',
      CreationDate: new Date(),
    },
  });
  
  // Coletar os chunks do PDF à medida que são gerados
  doc.on('data', chunk => chunks.push(chunk));
  
  // Quando o documento for finalizado, resolver com o buffer completo
  const pdfBuffer = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', reject);
  });

  try {
    // Gerar o QR Code com a URL de validação
    const baseUrl = process.env.BASE_URL || 'https://portal.edunexa.com.br';
    const verificationUrl = `${baseUrl}/validar-certificado/${certificateData.code}`;
    const qrCodeBuffer = await generateQRCode(verificationUrl);
    
    // Título principal
    doc.font('Helvetica-Bold').fontSize(16);
    doc.text('FACULDADE DYNAMUS', { align: 'center' });
    
    // Informações de credenciamento
    doc.font('Helvetica').fontSize(10);
    doc.moveDown();
    doc.text('Educação de alta qualidade para formação continuada de profissionais', { align: 'center' });
    
    // Título do histórico
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text('HISTÓRICO ESCOLAR', { align: 'center' });
    doc.moveDown();
    
    // Informações do curso e aluno
    doc.fontSize(12);
    
    // Tabela de dados do aluno
    doc.rect(50, doc.y, doc.page.width - 100, 100).stroke();
    
    // Primeira linha
    const startY = doc.y;
    
    // Coluna 1
    doc.text('Curso:', 60, startY + 10);
    doc.text('Nome:', 60, startY + 30);
    doc.text('Total de Horas:', 60, startY + 50);
    
    // Linha horizontal após a primeira linha
    doc.moveTo(50, startY + 70).lineTo(doc.page.width - 50, startY + 70).stroke();
    
    // Coluna central - linha vertical
    doc.moveTo(300, startY).lineTo(300, startY + 100).stroke();
    
    // Coluna 2
    doc.text('Área de Conhecimento:', 310, startY + 10);
    doc.text('Naturalidade:', 310, startY + 30);
    doc.text('Período do Curso:', 310, startY + 50);
    doc.text('Nascimento:', 310, startY + 70);
    
    // Avançar cursor para depois da tabela
    doc.y = startY + 110;
    
    // Tabela de disciplinas
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(12);
    
    // Cabeçalho da tabela
    const tableTop = doc.y;
    doc.rect(50, tableTop, doc.page.width - 100, 30).stroke();
    
    // Colunas do cabeçalho
    const colWidths = [200, 130, 50, 50, 50, 70];
    let currentX = 50;
    
    // Títulos das colunas
    doc.text('DISCIPLINAS', currentX + 5, tableTop + 10);
    currentX += colWidths[0];
    doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 30).stroke();
    
    doc.text('CORPO DOCENTE', currentX + 5, tableTop + 10);
    currentX += colWidths[1];
    doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 30).stroke();
    
    doc.text('TITULAÇÃO', currentX + 5, tableTop + 10);
    currentX += colWidths[2];
    doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 30).stroke();
    
    doc.text('CARGA HORÁRIA', currentX + 5, tableTop + 10, { width: colWidths[3], align: 'center' });
    currentX += colWidths[3];
    doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 30).stroke();
    
    doc.text('FREQUÊNCIA', currentX + 5, tableTop + 10);
    currentX += colWidths[4];
    doc.moveTo(currentX, tableTop).lineTo(currentX, tableTop + 30).stroke();
    
    doc.text('APROVEITAMENTO', currentX + 5, tableTop + 10);
    
    // Conteúdo da tabela (disciplinas)
    let rowY = tableTop + 30;
    doc.font('Helvetica').fontSize(10);
    
    if (certificateData.disciplines && certificateData.disciplines.length > 0) {
      certificateData.disciplines.forEach((discipline, index) => {
        const rowHeight = 30;
        
        // Linha de borda
        doc.rect(50, rowY, doc.page.width - 100, rowHeight).stroke();
        
        // Colunas da linha
        currentX = 50;
        
        // Nome da disciplina
        doc.text(discipline.name, currentX + 5, rowY + 10, { width: colWidths[0] - 10 });
        currentX += colWidths[0];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Professor
        doc.text(discipline.professorName || '', currentX + 5, rowY + 10, { width: colWidths[1] - 10 });
        currentX += colWidths[1];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Titulação
        doc.text(discipline.professorTitle || '', currentX + 5, rowY + 10, { width: colWidths[2] - 10 });
        currentX += colWidths[2];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Carga horária
        doc.text(discipline.workload?.toString() || '', currentX + 5, rowY + 10, { width: colWidths[3] - 10, align: 'center' });
        currentX += colWidths[3];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Frequência
        const frequencyText = discipline.attendance ? `${discipline.attendance}%` : '';
        doc.text(frequencyText, currentX + 5, rowY + 10, { width: colWidths[4] - 10, align: 'center' });
        currentX += colWidths[4];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Aproveitamento
        const performanceText = discipline.performance ? `${discipline.performance}%` : '';
        doc.text(performanceText, currentX + 5, rowY + 10, { width: colWidths[5] - 10, align: 'center' });
        
        rowY += rowHeight;
      });
    } else {
      // Se não houver disciplinas, exibir uma linha vazia
      const rowHeight = 30;
      doc.rect(50, rowY, doc.page.width - 100, rowHeight).stroke();
      doc.text('Nenhuma disciplina registrada', 50 + 5, rowY + 10, { width: doc.page.width - 100 - 10, align: 'center' });
      rowY += rowHeight;
    }
    
    // Seção de regime e critérios
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('REGIME E CRITÉRIOS ADOTADOS', { align: 'left' });
    doc.font('Helvetica').fontSize(10);
    doc.moveDown();
    
    // Lista de critérios
    const criterios = [
      'Avaliação formativa e somativa, por disciplina, aferida através de trabalhos, provas e exercícios.',
      'Aproveitamento mínimo de 70% (Setenta por cento).',
      'Frequência de pelo menos 75% (Setenta e cinco por cento), da carga horária por disciplina.',
      'Aprovação de Monografia Final.',
      'O presente curso cumpriu todas as disposições da Resolução CNE/CES n° 1, de 06 de abril de 2018.'
    ];
    
    criterios.forEach(criterio => {
      doc.text(`- ${criterio}`, { continued: false });
    });
    
    // Rodapé com assinatura
    const footerY = doc.page.height - 120;
    
    // Linha separadora
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke();
    
    // Nome da instituição (lado esquerdo)
    doc.font('Helvetica').fontSize(10);
    doc.text('FACULDADE DYNAMUS', 150, footerY + 50, { align: 'center' });
    
    // Assinatura do diretor (lado direito)
    if (certificateData.signerSignatureUrl) {
      try {
        doc.image(certificateData.signerSignatureUrl, doc.page.width - 200, footerY + 10, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar imagem da assinatura, usando assinatura padrão:', error);
        try {
          // Usar assinatura padrão SVG
          doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), doc.page.width - 200, footerY + 10, { width: 100 });
        } catch (fallbackError) {
          console.error('Erro ao carregar assinatura padrão, usando linha:', fallbackError);
          // Linha para assinatura manual
          doc.moveTo(doc.page.width - 250, footerY + 40).lineTo(doc.page.width - 100, footerY + 40).stroke();
        }
      }
    } else {
      try {
        // Usar assinatura padrão SVG
        doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), doc.page.width - 200, footerY + 10, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar assinatura padrão:', error);
        // Linha para assinatura manual
        doc.moveTo(doc.page.width - 250, footerY + 40).lineTo(doc.page.width - 100, footerY + 40).stroke();
      }
    }
    
    doc.text(certificateData.signerName || 'Ana Lúcia Moreira Gonçalves', doc.page.width - 170, footerY + 50, { align: 'center' });
    
    // QR Code (rodapé esquerdo)
    doc.image(qrCodeBuffer, 50, footerY + 10, { width: 80, height: 80 });
    
    // Logo da instituição
    if (certificateData.institutionLogo) {
      try {
        doc.image(certificateData.institutionLogo, 50, footerY + 20, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar logo da instituição:', error);
      }
    }
    
    // Finalizar o documento
    doc.end();
    
    // Aguardar a geração completa do buffer
    return await pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF do histórico escolar:', error);
    throw error;
  }
}

// Função para salvar o certificado em disco
export async function saveCertificatePdf(certificateId: number, pdfBuffer: Buffer, type: 'certificate' | 'transcript'): Promise<string> {
  const certificatesDir = path.join(process.cwd(), 'uploads/certificates');
  
  // Garantir que o diretório exista
  await fs.mkdir(certificatesDir, { recursive: true });
  
  // Gerar um nome de arquivo baseado no ID do certificado
  const fileName = `${type}_${certificateId}_${Date.now()}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  
  // Salvar o arquivo
  await fs.writeFile(filePath, pdfBuffer);
  
  // Retornar o caminho relativo (para URL)
  return `uploads/certificates/${fileName}`;
}