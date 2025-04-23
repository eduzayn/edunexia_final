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
  courseType?: string | null; // Tipo do curso (ex: Especialização, MBA, etc.)
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
    courseType: certificate.course?.category || 'Especialização',
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
    institutionName: 'FACULDADE DYNAMUS DE CAMPINAS', // Nome da instituição fixo conforme modelo
    institutionLogo: certificate.institution?.logo || '',
    signerName: certificate.signer?.name || 'Ana Lúcia Moreira Gonçalves',
    signerRole: certificate.signer?.role || 'Diretora Adjunta',
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

// Função para gerar o certificado (frente)
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
      Author: 'FACULDADE DYNAMUS DE CAMPINAS',
      Subject: `Certificado de conclusão - ${certificateData.courseName}`,
      Keywords: 'certificado, conclusão, curso, FADYC',
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
    
    // Background com cor creme/bege
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f5f5dc');
    
    // Arco dourado na parte superior (como no modelo)
    doc.path('M 0,100 C 300,30 500,30 841.89,100')
      .lineWidth(20)
      .stroke('#d4af37');
    
    // Logo FADYC (selo) no canto superior esquerdo
    const sealSize = 120;
    try {
      // Tentamos usar o logo da instituição, mas temos um fallback
      const fadycLogoPath = path.join(process.cwd(), 'public/assets/certificates/fadyc-logo.svg');
      doc.image(fadycLogoPath, 70, 70, { width: sealSize });
    } catch (error) {
      console.error('Erro ao carregar logo da FADYC:', error);
      // Em caso de erro, desenhar um círculo como placeholder
      doc.circle(125, 125, 50).fillAndStroke('#f0f0f0', '#d4af37');
      doc.fontSize(24).fill('#0a3d62').text('FADYC', 100, 115);
    }
    
    // Logo FADYC no canto superior direito
    try {
      const fadycSmallLogoPath = path.join(process.cwd(), 'public/assets/certificates/fadyc-logo-small.svg');
      doc.image(fadycSmallLogoPath, doc.page.width - 170, 100, { width: 100 });
    } catch (error) {
      console.error('Erro ao carregar logo da FADYC pequeno:', error);
    }
    
    // QR Code para validação no canto superior direito
    doc.image(qrCodeBuffer, doc.page.width - 120, 20, { width: 80, height: 80 });
    
    // Título principal (nome da instituição)
    doc.font('Helvetica-Bold').fontSize(32);
    doc.fill('#0a3d62'); // Cor azul escuro para o texto principal
    doc.text('FACULDADE DYNAMUS DE CAMPINAS', doc.page.width / 2, 180, { align: 'center' });
    
    // Título CERTIFICADO
    doc.fontSize(40);
    doc.text('CERTIFICADO', doc.page.width / 2, 230, { align: 'center' });
    
    // Introdução
    doc.font('Helvetica').fontSize(16);
    doc.text('Este certificado é orgulhosamente apresentado a:', doc.page.width / 2, 280, { align: 'center' });
    
    // Nome do aluno
    doc.font('Helvetica-Bold').fontSize(38);
    doc.text(certificateData.studentName, doc.page.width / 2, 330, { align: 'center' });
    doc.moveTo(doc.page.width * 0.25, 380).lineTo(doc.page.width * 0.75, 380).stroke('#0a3d62');
    
    // Texto do certificado
    doc.font('Helvetica').fontSize(14);
    
    // Obter a abreviação do tipo de curso
    const courseTypeAbbrev = getCourseTypeAbbreviation(certificateData.courseType || 'Especialização');
    
    // Texto do certificado (similar ao modelo fornecido)
    const certificateText = `O Diretor Geral da FACULDADE DYNAMUS DE CAMPINAS – FADYC, no uso de suas atribuições e tendo em vista a conclusão do ${courseTypeAbbrev} em ${certificateData.courseName} com duração de ${certificateData.totalHours} horas, outorga-lhe o presente Certificado, a fim de que possa gozar de todos os direitos e prerrogativas legais.`;
    
    doc.text(certificateText, doc.page.width / 2, 400, {
      align: 'center',
      width: doc.page.width * 0.8,
    });
    
    // Área de assinaturas
    const signatureY = doc.page.height - 130;
    
    // Linha para assinatura do aluno (esquerda)
    doc.moveTo(doc.page.width * 0.25 - 100, signatureY).lineTo(doc.page.width * 0.25 + 100, signatureY).stroke('#0a3d62');
    
    // Dados do aluno
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(certificateData.studentName, doc.page.width * 0.25, signatureY + 10, { align: 'center' });
    
    // Descrição do aluno
    doc.font('Helvetica').fontSize(12);
    doc.text('Profissional', doc.page.width * 0.25, signatureY + 30, { align: 'center' });
    
    // Assinatura do Diretor (direita)
    if (certificateData.signerSignatureUrl) {
      try {
        doc.image(certificateData.signerSignatureUrl, doc.page.width * 0.75 - 50, signatureY - 35, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar imagem da assinatura:', error);
        doc.moveTo(doc.page.width * 0.75 - 100, signatureY).lineTo(doc.page.width * 0.75 + 100, signatureY).stroke('#0a3d62');
      }
    } else {
      try {
        // Usar assinatura padrão SVG
        doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), doc.page.width * 0.75 - 50, signatureY - 35, { width: 100 });
      } catch (error) {
        console.error('Erro ao carregar assinatura padrão:', error);
        doc.moveTo(doc.page.width * 0.75 - 100, signatureY).lineTo(doc.page.width * 0.75 + 100, signatureY).stroke('#0a3d62');
      }
    }
    
    // Dados do Diretor
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(certificateData.signerName, doc.page.width * 0.75, signatureY + 10, { align: 'center' });
    
    // Cargo do Diretor
    doc.font('Helvetica').fontSize(12);
    doc.text(certificateData.signerRole, doc.page.width * 0.75, signatureY + 30, { align: 'center' });
    
    // Código de validação em texto
    doc.font('Helvetica').fontSize(8);
    doc.text(`Código de Validação: ${certificateData.code}`, doc.page.width - 150, doc.page.height - 20, { align: 'center' });
    
    // Adicionar segunda página (histórico escolar)
    doc.addPage();
    
    // Título da segunda página
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('Faculdade Dynamus de Campinas – FADYC', doc.page.width / 2, 50, { align: 'center' });
    
    // Informações de credenciamento
    doc.fontSize(10).font('Helvetica');
    doc.text('Credenciada no MEC através da Portaria Nº 1484 de 20 de Dezembro de 2016, Publicado D.O.U. 21/12/2016 e Portaria Nº 949 de 7 de Dezembro de 2022.', 
          doc.page.width / 2, 80, { align: 'center', width: doc.page.width - 100 });
    
    // Título HISTÓRICO ESCOLAR
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('HISTÓRICO ESCOLAR', doc.page.width / 2, 110, { align: 'center' });
    
    // Tabela de dados do aluno e curso
    const tableTopY = 140;
    const colWidth = (doc.page.width - 100) / 2;
    
    // Desenhar a tabela de informações do aluno/curso
    doc.rect(50, tableTopY, doc.page.width - 100, 100).stroke();
    
    // Divisão vertical no meio da tabela
    doc.moveTo(50 + colWidth, tableTopY).lineTo(50 + colWidth, tableTopY + 100).stroke();
    
    // Campos da coluna esquerda
    doc.fontSize(10).font('Helvetica');
    doc.text('Curso:', 60, tableTopY + 10);
    doc.text('Nome:', 60, tableTopY + 35);
    doc.text('Total de Horas:', 60, tableTopY + 60);
    
    // Campos da coluna direita
    doc.text('Área de Conhecimento:', 60 + colWidth, tableTopY + 10);
    doc.text('Naturalidade:', 60 + colWidth, tableTopY + 35);
    doc.text('Período do Curso:', 60 + colWidth, tableTopY + 60);
    doc.text('Nascimento:', 60 + colWidth, tableTopY + 85);
    
    // Tabela de disciplinas
    const disciplinesTableY = tableTopY + 120;
    
    // Cabeçalho da tabela de disciplinas
    doc.rect(50, disciplinesTableY, doc.page.width - 100, 30).stroke();
    
    // Divisões verticais para as colunas
    const colWidths = [250, 150, 80, 80, 80, 100]; // Larguras das colunas
    let currentX = 50;
    
    // Títulos das colunas
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('DISCIPLINAS', currentX + 5, disciplinesTableY + 10);
    currentX += colWidths[0];
    doc.moveTo(currentX, disciplinesTableY).lineTo(currentX, disciplinesTableY + 30).stroke();
    
    doc.text('CORPO DOCENTE', currentX + 5, disciplinesTableY + 10);
    currentX += colWidths[1];
    doc.moveTo(currentX, disciplinesTableY).lineTo(currentX, disciplinesTableY + 30).stroke();
    
    doc.text('TITULAÇÃO', currentX + 5, disciplinesTableY + 10);
    currentX += colWidths[2];
    doc.moveTo(currentX, disciplinesTableY).lineTo(currentX, disciplinesTableY + 30).stroke();
    
    doc.text('CARGA HORÁRIA', currentX + 5, disciplinesTableY + 10);
    currentX += colWidths[3];
    doc.moveTo(currentX, disciplinesTableY).lineTo(currentX, disciplinesTableY + 30).stroke();
    
    doc.text('FREQUÊNCIA', currentX + 5, disciplinesTableY + 10);
    currentX += colWidths[4];
    doc.moveTo(currentX, disciplinesTableY).lineTo(currentX, disciplinesTableY + 30).stroke();
    
    doc.text('APROVEITAMENTO', currentX + 5, disciplinesTableY + 10);
    
    // Adicionar linhas para as disciplinas
    let rowY = disciplinesTableY + 30;
    const rowHeight = 25;
    
    if (certificateData.disciplines && certificateData.disciplines.length > 0) {
      certificateData.disciplines.forEach((discipline, index) => {
        // Borda horizontal da linha
        doc.rect(50, rowY, doc.page.width - 100, rowHeight).stroke();
        
        // Conteúdo das colunas
        currentX = 50;
        
        // Nome da disciplina
        doc.font('Helvetica').fontSize(9);
        doc.text(discipline.name, currentX + 5, rowY + 8, { width: colWidths[0] - 10 });
        currentX += colWidths[0];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Professor
        doc.text(discipline.professorName || '', currentX + 5, rowY + 8, { width: colWidths[1] - 10 });
        currentX += colWidths[1];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Titulação
        doc.text(discipline.professorTitle || '', currentX + 5, rowY + 8, { width: colWidths[2] - 10 });
        currentX += colWidths[2];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Carga Horária
        doc.text(discipline.workload.toString(), currentX + 5, rowY + 8, { width: colWidths[3] - 10, align: 'center' });
        currentX += colWidths[3];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Frequência
        const frequencyText = discipline.attendance ? `${discipline.attendance}%` : '';
        doc.text(frequencyText, currentX + 5, rowY + 8, { width: colWidths[4] - 10, align: 'center' });
        currentX += colWidths[4];
        doc.moveTo(currentX, rowY).lineTo(currentX, rowY + rowHeight).stroke();
        
        // Aproveitamento
        const performanceText = discipline.performance ? `${discipline.performance}%` : '';
        doc.text(performanceText, currentX + 5, rowY + 8, { width: colWidths[5] - 10, align: 'center' });
        
        // Atualizar posição Y para a próxima linha
        rowY += rowHeight;
      });
    } else {
      // Se não houver disciplinas, exibir uma linha vazia
      doc.rect(50, rowY, doc.page.width - 100, rowHeight).stroke();
      doc.font('Helvetica').fontSize(9);
      doc.text('Nenhuma disciplina registrada', 50 + 5, rowY + 8, { width: doc.page.width - 100 - 10, align: 'center' });
      rowY += rowHeight;
    }
    
    // Adicionar seção de regime e critérios adotados
    const criteriaY = rowY + 30;
    doc.rect(50, criteriaY, doc.page.width - 100, 100).stroke();
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('REGIME E CRITÉRIOS ADOTADOS', 60, criteriaY + 10);
    
    doc.fontSize(9).font('Helvetica');
    doc.text('- Avaliação formativa e somativa, por disciplina, aferida através de trabalhos, provas e exercícios.', 60, criteriaY + 30);
    doc.text('- Aproveitamento mínimo de 70% (Setenta por cento).', 60, criteriaY + 45);
    doc.text('- Frequência de pelo menos 75% (Setenta e cinco por cento), da carga horária por disciplina.', 60, criteriaY + 60);
    doc.text('- Aprovação de Monografia Final.', 60, criteriaY + 75);
    doc.text('- O presente curso cumpriu todas as disposições da Resolução CNE/CES nº 1, de 06 de abril de 2018.', 60, criteriaY + 90);
    
    // Área para assinatura na parte inferior do histórico
    const signatureBottomY = doc.page.height - 80;
    
    // Nome da instituição à esquerda
    doc.fontSize(10).font('Helvetica');
    doc.text('Faculdade Dynamus de Campinas - FADYC', 150, signatureBottomY);
    
    // Assinatura da Diretora à direita
    try {
      doc.image(path.join(process.cwd(), 'public/assets/certificates/signature.svg'), doc.page.width - 250, signatureBottomY - 40, { width: 100 });
    } catch (error) {
      console.error('Erro ao carregar assinatura no histórico:', error);
      doc.moveTo(doc.page.width - 300, signatureBottomY).lineTo(doc.page.width - 150, signatureBottomY).stroke();
    }
    
    // Nome da Diretora
    doc.text(certificateData.signerName, doc.page.width - 225, signatureBottomY);
    
    // QR Code no canto inferior esquerdo
    doc.image(qrCodeBuffer, 50, doc.page.height - 120, { width: 80, height: 80 });
    
    // Logo FADYC no canto inferior esquerdo ao lado do QR code
    try {
      const fadycSmallLogoPath = path.join(process.cwd(), 'public/assets/certificates/fadyc-logo-small.svg');
      doc.image(fadycSmallLogoPath, 140, doc.page.height - 100, { width: 60 });
    } catch (error) {
      console.error('Erro ao carregar logo da FADYC pequeno no histórico:', error);
    }
    
    // Finalizar o documento
    doc.end();
    
    // Aguardar a geração completa do buffer
    return await pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF do certificado:', error);
    throw error;
  }
}

// Função auxiliar para obter abreviação do tipo de curso
function getCourseTypeAbbreviation(courseType: string): string {
  const typesMap: { [key: string]: string } = {
    'Especialização': 'Especialização',
    'MBA': 'MBA',
    'Pós-Graduação': 'curso de Pós-Graduação Lato Sensu',
    'Segunda Licenciatura': 'curso de Segunda Licenciatura',
    'Formação Pedagógica': 'curso de Formação Pedagógica',
    'Extensão': 'curso de Extensão',
  };
  
  return typesMap[courseType] || 'curso de Pós-Graduação Lato Sensu';
}

// Função para gerar o histórico escolar
export async function generateTranscriptPdf(certificateId: number): Promise<Buffer> {
  // Reutilizamos a função generateCertificatePdf, pois já implementamos a segunda página como histórico
  // Na segunda página do certificado já está o histórico escolar
  return await generateCertificatePdf(certificateId);
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
  
  return filePath;
}