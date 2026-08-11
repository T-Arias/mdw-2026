# Clase 1 — Comandos usados en clase

Referencia rapida de los comandos de terminal, npm y Git que se usan en `clase1.md`. Cada uno con
que hace y un ejemplo en el contexto concreto de esta clase.

---

## Node

### `node -v`

Muestra la version de Node instalada. Sirve para verificar el entorno antes de arrancar.

```bash
node -v
# v20.14.0
```

### `node <archivo>.js`

Ejecuta un archivo JavaScript con Node.

```bash
node demo.js
```

### `node <archivo>.js <args>`

Los argumentos que van despues del nombre del archivo llegan al script a traves de
`process.argv` (a partir del indice 2).

```bash
node demo.js hola mundo --puerto=3000
```

---

## npm

### `npm -v`

Muestra la version de npm instalada (viene junto con Node).

```bash
npm -v
# 10.7.0
```

### `npm init -y`

Crea un `package.json` con valores por defecto, sin hacer las preguntas interactivas una por una
(`-y` = yes a todo). Es el primer paso para convertir una carpeta en un proyecto de Node.

```bash
npm init -y
```

### `npm install <paquete>`

Instala un paquete y lo agrega a `dependencies` en `package.json`. Se usa para librerias que el
proyecto necesita en produccion.

```bash
npm install express dotenv cors
```

### `npm install --save-dev <paquete>` (o `npm install -D <paquete>`)

Instala un paquete y lo agrega a `devDependencies`. Se usa para herramientas que solo hacen falta
durante el desarrollo (compiladores, tipos, linters), no en el servidor final.

```bash
npm install --save-dev typescript tsx @types/node @types/express @types/cors
```

### `npm run <script>`

Ejecuta un script definido en la seccion `"scripts"` del `package.json`.

```json
"scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
```

```bash
npm run dev     # levanta el servidor en modo desarrollo
npm run build   # compila TypeScript a JavaScript
```

### `npm run <script> -- <args>`

Todo lo que va despues de `--` se le pasa como argumento al script en lugar de interpretarse como
una flag de `npm`.

```bash
npm run playground -- --puerto=3000
```

### `npm start`

Atajo especial: equivale a `npm run start`, pero no requiere el prefijo `run`. Convencionalmente
se usa para correr la version final/compilada del proyecto.

```bash
npm start
```

### `npx <comando>`

Ejecuta un binario de un paquete sin necesidad de instalarlo globalmente en el sistema. Si el
paquete no esta instalado, npm lo descarga temporalmente para esa ejecucion.

```bash
npx tsc --init
```

---

## TypeScript

### `tsc --init`

Genera un `tsconfig.json` con todas las opciones disponibles (la mayoria comentadas) y valores
por defecto razonables. Se usa una unica vez, al arrancar el proyecto.

```bash
npx tsc --init
```

### `tsc -p tsconfig.json` (o simplemente `tsc`, si el archivo esta en la raiz)

Compila el proyecto TypeScript completo segun la configuracion de `tsconfig.json`, escribiendo el
JavaScript resultante en la carpeta indicada por `outDir`.

```bash
npx tsc -p tsconfig.json
# equivalente al script "build" del proyecto de esta clase
```

---

## Terminal (generales, usados en la demo de process)

### Redireccion de stdout y stderr por separado

```bash
node demo.js > salida.txt 2> errores.txt
```

`>` redirige `stdout` al archivo indicado; `2>` redirige especificamente el descriptor 2
(`stderr`) a otro archivo. Sin el `2`, la redireccion por defecto solo captura `stdout`.
