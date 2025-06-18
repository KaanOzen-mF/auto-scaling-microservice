# --- STAGE 1: The Builder Stage ---
# This first stage is responsible for compiling our TypeScript application into JavaScript.
# We use the 'node:18-alpine' image as our base. 'alpine' versions are very lightweight,
# which helps reduce image size. We name this stage 'builder' to reference it later.
FROM node:18-alpine AS builder

# Sets the working directory within the container for this stage. Subsequent commands
# will be executed relative to this path.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first. This leverages Docker's layer caching.
# If these files haven't changed between builds, Docker will use the cached layer for the
# next step (npm install), significantly speeding up the build process.
COPY package*.json ./

# Install all dependencies from package.json, including devDependencies like 'typescript'
# and 'ts-node', which are necessary to build the project.
# '--frozen-lockfile' ensures that the exact versions from package-lock.json are installed.
RUN npm install --frozen-lockfile

# Copy the TypeScript configuration and source code into the container.
COPY tsconfig.json ./
COPY src ./src

# Execute the 'build' script defined in package.json (which runs 'tsc').
# This transpiles our TypeScript source code from the 'src' folder into executable
# JavaScript, outputting it to the 'dist' folder as defined in tsconfig.json.
RUN npm run build

# --- STAGE 2: The Production Stage ---
# This second stage creates our final, optimized production image.
# We start from a fresh, clean base image to ensure our final image is as small
# and secure as possible, containing no build tools or source code.
FROM node:18-alpine

# Set the Node.js environment to 'production'. This is a standard practice that
# can improve performance in frameworks like Express.
ENV NODE_ENV=production

# Set the working directory for the production stage.
WORKDIR /usr/src/app

# Copy package files again to install only production dependencies.
COPY package*.json ./

# Install ONLY the production dependencies ('dependencies' in package.json) and skip
# 'devDependencies'. 'npm ci' is used for faster, more reliable builds in CI/CD environments.
RUN npm ci --only=production --frozen-lockfile

# The core of the multi-stage build: copy ONLY the compiled JavaScript code (the 'dist' folder)
# from the 'builder' stage into our final production image. This keeps the image lightweight.
COPY --from=builder /usr/src/app/dist ./dist

# Document that the container will listen on port 3001 at runtime.
# This does not publish the port but serves as important metadata.
EXPOSE 3001

# The command that will be executed when a container based on this image starts.
# It runs the compiled application's entry point using Node.js.
CMD [ "node", "dist/index.js" ]