FROM node:20 as builder
WORKDIR /src/
COPY ./package.json ./package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM nginx:1.25 as server
COPY --from=builder /src/out/ /usr/share/nginx/html/
