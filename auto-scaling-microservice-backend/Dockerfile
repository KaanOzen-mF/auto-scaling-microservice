# --- STAGE 1: The Builder Stage ---
# This stage is responsible for building our TypeScript code into JavaScript.
# We use a specific Node.js version on an Alpine Linux base image. Alpine is a very small
# Linux distribution, which helps in keeping our final image size smaller.
# We name this stage 'builder' so we can refer to it later.
FROM node:18-alpine AS builder

# Set the working directory inside the container. All subsequent commands (COPY, RUN, etc.)
# will be executed from this directory.
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if it exists) files.
# We copy these files first to leverage Docker's layer caching. If these files don't change,
# Docker won't re-run the `npm install` step on subsequent builds, speeding up the process.
COPY package*.json ./

# Install ALL dependencies, including 'devDependencies' (like typescript, ts-node)
# which are required to build the application.
# `npm install` is used here instead of `npm ci` because we might need to create a lock file if one doesn't exist.
# --frozen-lockfile ensures that npm doesn't update the package-lock.json.
RUN npm install --frozen-lockfile

# Copy the TypeScript configuration file.
COPY tsconfig.json ./

# Copy the entire source code directory into the container.
COPY src ./src

# Execute the 'build' script defined in our package.json.
# This command runs the TypeScript compiler (tsc), which transpile our .ts files
# from the 'src' directory into plain JavaScript files in the 'dist' directory.
RUN npm run build

# --- STAGE 2: The Production Stage ---
# This stage will create our final, lightweight production image.
# We start from a fresh Node.js Alpine base image to ensure no build artifacts or
# devDependencies from the builder stage are included, unless we explicitly copy them.
FROM node:18-alpine

# Set the Node.js environment to 'production'. This is a standard practice that can
# improve performance in some libraries (like Express) and is good for signaling the app's state.
ENV NODE_ENV=production

# Set the working directory for the production stage.
WORKDIR /usr/src/app

# Copy package files again to install only production dependencies.
COPY package*.json ./

# Install ONLY the 'dependencies' listed in package.json, skipping 'devDependencies'.
# `npm ci` is generally preferred over `npm install` for production builds as it provides
# faster, more reliable, and reproducible builds based on the package-lock.json file.
RUN npm ci --only=production --frozen-lockfile

# This is the core of the multi-stage build. We copy ONLY the compiled JavaScript code
# (the 'dist' folder) from the 'builder' stage into our final production image.
# This keeps the final image small and secure, as it doesn't contain the source .ts files
# or any development dependencies.
COPY --from=builder /usr/src/app/dist ./dist

# Document that the container listens on port 3000 at runtime.
# This does not actually publish the port, but serves as documentation for the user
# and for tools interacting with the container.
EXPOSE 3000

# The command that will be executed when the container starts.
# It runs the compiled application using Node.js.
CMD ["node", "dist/index.js"]