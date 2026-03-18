#!/bin/bash

# Script to build a pre-bootstrapped OpenSearch Dashboards Docker image
# This creates an image with bootstrap already completed, making deployments faster

set -e

# Colors for output
ERROR='\033[0;31m'
SUCCESS='\033[0;32m'
INFO='\033[0;34m'
RESET='\033[0m'

# Default values
IMAGE_NAME="chorus-opensearch-dashboards"
IMAGE_TAG="prebuild"
PUSH_TO_REGISTRY=false
REGISTRY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag|-t)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --name|-n)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --push|-p)
            PUSH_TO_REGISTRY=true
            shift
            ;;
        --registry|-r)
            REGISTRY="$2"
            PUSH_TO_REGISTRY=true
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --name, -n NAME       Image name (default: chorus-opensearch-dashboards)"
            echo "  --tag, -t TAG         Image tag (default: prebuild)"
            echo "  --push, -p            Push to registry after build"
            echo "  --registry, -r REG    Registry to push to (e.g., ghcr.io/username, docker.io/username)"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                           # Build locally"
            echo "  $0 --tag latest --push                      # Build and push to Docker Hub"
            echo "  $0 --registry ghcr.io/myuser --tag v1.0.0  # Build and push to GitHub Container Registry"
            exit 0
            ;;
        *)
            echo -e "${ERROR}Unknown option: $1${RESET}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Construct full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
fi

echo -e "${INFO}========================================${RESET}"
echo -e "${INFO}Building Pre-Bootstrapped OpenSearch Dashboards Image${RESET}"
echo -e "${INFO}========================================${RESET}"
echo ""

# Check if OpenSearch-Dashboards directory exists
if [ ! -d "OpenSearch-Dashboards" ]; then
    echo -e "${ERROR}ERROR: OpenSearch-Dashboards directory not found!${RESET}"
    echo ""
    echo "Please ensure you have:"
    echo "  1. Cloned https://github.com/opensearch-project/OpenSearch-Dashboards"
    echo "     into ./OpenSearch-Dashboards"
    echo "  2. Cloned plugins into ./OpenSearch-Dashboards/plugins/"
    echo ""
    exit 1
fi

# Check if Dockerfile.prebuild exists
if [ ! -f "Dockerfile.prebuild" ]; then
    echo -e "${ERROR}ERROR: Dockerfile.prebuild not found!${RESET}"
    exit 1
fi

echo -e "${INFO}Building image: ${FULL_IMAGE_NAME}${RESET}"
echo -e "${INFO}This will take 15-30 minutes as it runs yarn osd bootstrap...${RESET}"
echo ""

# Build the image
if docker build -f Dockerfile.prebuild -t "$FULL_IMAGE_NAME" .; then
    echo ""
    echo -e "${SUCCESS}✓ Image built successfully!${RESET}"
    echo -e "${INFO}Image: ${FULL_IMAGE_NAME}${RESET}"
    
    # Show image size
    IMAGE_SIZE=$(docker images "$FULL_IMAGE_NAME" --format "{{.Size}}")
    echo -e "${INFO}Size: ${IMAGE_SIZE}${RESET}"
else
    echo ""
    echo -e "${ERROR}✗ Image build failed!${RESET}"
    exit 1
fi

# Push to registry if requested
if [ "$PUSH_TO_REGISTRY" = true ]; then
    echo ""
    echo -e "${INFO}Pushing image to registry...${RESET}"
    
    if docker push "$FULL_IMAGE_NAME"; then
        echo -e "${SUCCESS}✓ Image pushed successfully!${RESET}"
        echo -e "${INFO}You can now pull it with: docker pull ${FULL_IMAGE_NAME}${RESET}"
    else
        echo -e "${ERROR}✗ Image push failed!${RESET}"
        echo -e "${INFO}You may need to login first: docker login${RESET}"
        exit 1
    fi
fi

echo ""
echo -e "${SUCCESS}========================================${RESET}"
echo -e "${SUCCESS}Build Complete!${RESET}"
echo -e "${SUCCESS}========================================${RESET}"
echo ""
echo "To use this image in docker-compose.yml, change:"
echo "  build: ./opensearch-dashboards/."
echo "to:"
echo "  image: ${FULL_IMAGE_NAME}"
echo ""
echo "To run directly:"
echo "  docker run -p 5601:5601 ${FULL_IMAGE_NAME}"
echo ""