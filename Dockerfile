FROM node:18

# carpeta de trabajo dentro del contenedor
WORKDIR /app

# copiar solo package.json de server
COPY server/package*.json ./

# instalar dependencias
RUN npm install

# copiar el resto del código
COPY server/ .

# exponer puerto de api
EXPOSE 3001

# comando de inicio
CMD ["npm", "start"]