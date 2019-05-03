FROM node:11
EXPOSE 1234

WORKDIR /app
COPY . /app
RUN npm install

ENTRYPOINT ["npm", "start"]