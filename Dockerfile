FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force \
    && mkdir -p /data/uploads && chown -R node:node /data
COPY --chown=node:node server.mjs db.mjs config.mjs ./
COPY --chown=node:node public ./public
COPY --chown=node:node private ./private
COPY --chown=node:node scripts/create-admin.mjs ./scripts/create-admin.mjs
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
