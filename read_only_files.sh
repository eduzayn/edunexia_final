#!/bin/bash

# Arquivos do frontend relacionados a cursos
chmod 444 client/src/pages/admin/academico/course-form-page.tsx
chmod 444 client/src/pages/admin/academico/courses-page.tsx
chmod 444 client/src/pages/student/courses-page.tsx
chmod 444 client/src/pages/student/course-detail-page.tsx
chmod 444 client/src/pages/admin/cursos/course-payment-links.tsx

# Componentes relacionados a cursos
chmod 444 client/src/components/dialogs/create-course-dialog.tsx
chmod 444 client/src/components/payment-links/payment-link-creator.tsx
chmod 444 client/src/components/payment-links/payment-links-manager.tsx

# Arquivos do backend relacionados a cursos
chmod 444 server/routes.ts
chmod 444 server/routes/course-payment-links.ts
chmod 444 server/services/asaas-course-payment-service.ts
chmod 444 server/services/asaas-protected/asaas-course-payment-service.ts
chmod 444 server/controllers/course-payment-link-controller.ts

# Esquema de dados e modelos
chmod 444 shared/schema.ts

echo "Todos os arquivos relacionados a cursos foram configurados como somente leitura."
