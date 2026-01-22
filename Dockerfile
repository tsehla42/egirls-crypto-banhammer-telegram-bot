# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.14.0

########## Build Stage ##########
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app

# Step 1: Use bind+cache to install dependencies quickly, then copy actual files
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Step 2: Copy the rest of the project and compile
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run compile

########## Runtime Stage ##########
FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only what's needed for runtime
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Run as non-root user
USER node

CMD ["node", "dist/bot.js"]
