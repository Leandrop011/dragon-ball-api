
# ! DOCKER FILE QUE CONTRUYE NUESTRA APP(NO LEVANTA) EN 3 PASOS
# * 1 (step deps)
# ? copiamos el package y el yarn
FROM node:24-alpine3.24 AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile


# * 2 (step builder)
# ? copiamos las dependencias 
FROM node:24-alpine3.24 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# * 3 (step runner)
# ? copiamos la dist and run app
FROM node:24-alpine3.24 AS runner
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --prod
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public


CMD [ "node", "dist/main" ]

