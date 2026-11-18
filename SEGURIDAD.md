# Seguridad de GARVI

## Qué había y qué se ha hecho

| Problema | Estado |
|---|---|
| Las contraseñas (ivan / halem) estaban **en texto plano** en el código público de GitHub | ✅ Ahora solo hay su huella SHA-256. **Pero siguen visibles en el historial antiguo de GitHub → cámbialas** (ver abajo). |
| Listados de deudores (clientes e importes) incrustados en el código público | ✅ Quitados del código (ahora se importan desde el Excel). Siguen en el historial antiguo del repo. |
| Datos de clientes (direcciones, teléfonos) en `js/datos.js` dentro de un repo público | ⚠️ Pendiente: solución real = repo privado (ver paso 4). |
| La app entra en Firebase como **usuario anónimo** y las reglas de Firestore no se ven en el repo | ⚠️ **Es el punto más importante.** Cualquiera con la clave pública de la app puede entrar anónimo y leer/escribir todos los datos si las reglas son abiertas. Pasos 1-3. |

El inicio de sesión de la app (usuario/contraseña) se comprueba **en el navegador**: sirve para
que no entre cualquiera por la pantalla, pero no protege los datos. Lo que protege los datos son
las **reglas de Firestore**, y para eso hace falta que Firebase sepa quién es cada persona.

## Pasos (solo necesitas la consola de Firebase, 5 minutos)

Consola: https://console.firebase.google.com → proyecto **garvi-app**

1. **Authentication → Método de acceso → activar "Correo electrónico/contraseña".**
   Luego **Usuarios → Añadir usuario**: `ivan@garvi.app` y `halem@garvi.app`, cada uno con una
   contraseña NUEVA y larga (no reutilices las antiguas).
2. ✅ HECHO: la app ya inicia sesión en Firebase con esas cuentas (ya no entra como anónimo).
   Cada dispositivo pedirá usuario (`ivan` / `halem`) y la contraseña NUEVA una sola vez.
3. Cuando la app ya use esas cuentas: **Firestore → Reglas →** pega el contenido de
   `firestore.rules` → **Publicar**. Desde ese momento solo esas dos cuentas acceden.
4. **Repo privado:** GitHub → repo `garvi-app` → Settings → Danger zone → *Change visibility* →
   Private. OJO: GitHub Pages en repos privados necesita plan de pago. Alternativa gratuita:
   publicar la app con **Firebase Hosting** (ya tienes el proyecto) y dejar el repo privado.

## Importante
- Las contraseñas antiguas siguen en el historial público de GitHub: **cámbialas** (si hubiera
  alguna igual en otros sitios, cámbiala también allí). Para cambiarlas en la app dime las nuevas
  y genero la huella; no hace falta que las escribas en ningún archivo.
- La clave `apiKey` de Firebase que ves en el código **no es un secreto** (es pública por diseño);
  lo que la protege son las reglas del paso 3.
