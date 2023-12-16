# Используем официальный образ Node.js
FROM node:latest

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы приложения
COPY . .

# Открываем порт, который будет слушать ваше приложение
EXPOSE 3333
EXPOSE 5432

# Команда для запуска вашего приложения
CMD ["npm", "start"]
