-- Verificar se o estudante já existe
SELECT id, username, email FROM users WHERE email = 'anateste5@gmail.com' OR username = 'anateste5@gmail.com';

-- Se o estudante não existir, criar um novo perfil de estudante
-- (Esta consulta deve ser executada manualmente se necessário)
INSERT INTO users (username, password, full_name, email, portal_type, cpf, phone, status)
VALUES ('anateste5@gmail.com', '06042733675', 'anateste5', 'anateste5@gmail.com', 'student', '06042733675', '3798805276', 'active')
RETURNING id;

-- Atualizar a matrícula simplificada com o ID do estudante
-- (Substitua N pelo ID do usuário retornado na consulta acima)
UPDATE simplified_enrollments
SET student_id = <ID_DO_USUARIO>
WHERE id = 18 AND student_email = 'anateste5@gmail.com';

-- Verificar resultado
SELECT id, student_email, student_id FROM simplified_enrollments WHERE id = 18;