# Guía de Despliegue en Vercel (Backend)

## Requisitos
- Cuenta en [Vercel](https://vercel.com)
- Proyecto en GitHub con el backend

---

## Paso 1: Preparar el código

Ya está configurado el archivo `vercel.json`. Asegurate de tener:
- ✅ `vercel.json` en la raíz del backend
- ✅ `src/server.js` exporta la app por defecto

---

## Paso 2: Desplegar a Vercel

### Opción A: Desde la web
1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. En "Configure Project":
   - **Framework Preset**: Other
   - **Root Directory**: `./backend` (si el backend está en una carpeta)
   - O leave as is si todo está en la raíz
5. Click "Deploy"

### Opción B: Desde CLI
```bash
npm install -g vercel
cd backend
vercel
```

---

## Paso 3: Configurar Variables de Entorno

En el dashboard de Vercel, después del deploy:

1. Click en tu proyecto
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
DB_HOST=tu_mysql_host_de_railway
DB_USER=root
DB_PASSWORD=tu_password_de_mysql
DB_NAME=railway
DB_PORT=3306

JWT_SECRET=una_clave_secreta_segura

RESEND_API_KEY=re_xxxxxxxxxxxx

FRONTEND_URL=https://viggo-gym.netlify.app
```

---

## Paso 4: Obtener valores de Railway MySQL

En Railway:
1. Andá al servicio de **MySQL**
2. Buscá en **Variables** los valores de:
   - `MYSQLHOST` o similar
   - `MYSQLPASSWORD`
   - `MYSQLPORT` (usualmente 3306)
3. Estos valores van en las variables de Vercel

---

## Paso 5: Redeploy

Después de agregar las variables:
1. Ve a **Deployments** en Vercel
2. Click en el último deploy
3. Click en **"Redeploy"**

---

## Paso 6: Verificar

Tu backend estará en:
```
https://tu-proyecto.vercel.app
```

Probá:
```
https://tu-proyecto.vercel.app/
```
Debería responder: "Servidor funcionando 🚀"

---

## Notas Importantes

### MySQL debe estar accesible públicamente
Railway MySQL por defecto solo permite conexiones desde Railway. Para conectar desde Vercel:

1. En Railway, andá al servicio de MySQL
2. Buscá **"Networking"** o **"Public Networking"**
3. Habilitá **"Public IPv6"** o **"Allow HTTP Ingress"**

### O alternativas:
- Usar **Planetscale** (MySQL-compatible, gratis, público por defecto)
- Usar **Supabase** (PostgreSQL, pero tienen MySQL también)
- Usar **Aiven** (MySQL gratis con IP pública)

---

## Solución de problemas

### Error "Connection refused"
- El MySQL de Railway no tiene red pública habilitada
- Solución: Habilitar "Public Networking" en Railway

### Error "Access denied"
- La contraseña de MySQL es incorrecta
- Verificá las variables en Vercel

### Error "Can't connect to MySQL server"
- El host de MySQL está mal
- Verificá que el DB_HOST sea correcto
