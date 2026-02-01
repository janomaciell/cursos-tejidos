# E-Learning Frontend - React + Vite

Plataforma de e-learning para cursos de costura y tejido.

## 🚀 Instalación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

## 📦 Scripts

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Previsualizar build de producción

## 🔧 Configuración

Crear archivo `.env` con las siguientes variables:
```env
VITE_API_URL=http://localhost:8000/api
VITE_MERCADOPAGO_PUBLIC_KEY=your-public-key
```

## 📂 Estructura del Proyecto
```
src/
├── api/              # Servicios API
├── components/       # Componentes reutilizables
├── context/          # Context API
├── hooks/            # Custom hooks
├── pages/            # Páginas
├── routes/           # Configuración de rutas
├── styles/           # Estilos globales
├── utils/            # Utilidades
├── App.jsx           # Componente principal
└── main.jsx          # Punto de entrada
```

## 🎨 Tecnologías

- React 18
- Vite
- React Router DOM
- Axios
- CSS Modules

## 📝 Características

- ✅ Autenticación JWT
- ✅ Catálogo de cursos
- ✅ Reproductor de video seguro
- ✅ Sistema de pagos con Mercado Pago
- ✅ Seguimiento de progreso
- ✅ Perfil de usuario
- ✅ Historial de compras
- ✅ Diseño responsive

## 🚀 Deploy

El proyecto está configurado para ser desplegado en Vercel.
```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.









# 1. Asegúrate de que el servidor esté corriendo
cd backend
python manage.py runserver

# 2. Accede a: http://localhost:8000/admin
# Usuario: tu superusuario
# Contraseña: tu contraseña
```

---

### Paso 2: Crear el Curso

1. En el panel admin, ve a **COURSES → Courses → Add Course**

2. Completa los campos:
```
Title: Curso de Peluches Amigurumi
Slug: curso-peluches-amigurumi (se genera automáticamente)
Description: 
"Aprende a crear adorables peluches amigurumi desde cero. 
En este curso aprenderás todas las técnicas necesarias para 
tejer hermosos peluches usando crochet. Ideal para principiantes 
que quieran adentrarse en el mundo del tejido."

Short Description: 
"Crea peluches amigurumi únicos con técnicas profesionales de crochet"

Cover Image: [Sube una imagen - 800x450px recomendado]

Price: 15000.00

Difficulty: beginner

Duration Hours: 8

Is Active: ✓ (marcado)
Is Featured: ✓ (marcado)

Created By: [Tu usuario]
```

3. Click en **SAVE**

---

### Paso 3: Crear Módulos del Curso

1. Ve a **COURSES → Modules → Add Module**

**Módulo 1:**
```
Course: Curso de Peluches Amigurumi
Title: Introducción al Amigurumi
Description: Conoce los materiales y técnicas básicas del amigurumi
Order: 1
```

**Módulo 2:**
```
Course: Curso de Peluches Amigurumi
Title: Tu Primer Peluche
Description: Aprende a crear tu primer amigurumi paso a paso
Order: 2
```

**Módulo 3:**
```
Course: Curso de Peluches Amigurumi
Title: Técnicas Avanzadas
Description: Domina técnicas profesionales para crear diseños complejos
Order: 3