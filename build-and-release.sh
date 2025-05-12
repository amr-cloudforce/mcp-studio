#!/bin/bash
# build-and-release.sh - Script to build MCP Studio and update the release system

# Parameters
VERSION=$1
PLATFORM=${2:-"all"}  # "all", "mac", "mac-arm64", "mac-x64", "windows"
MAKE_LATEST=${3:-false}  # Optional third parameter, defaults to false

# Validate inputs
if [ -z "$VERSION" ]; then
  echo "Usage: ./build-and-release.sh <version> [platform] [make_latest]"
  echo "Example: ./build-and-release.sh 1.2.0 mac true"
  echo ""
  echo "Platforms (defaults to 'all'):"
  echo "  all        - Build for all platforms (mac and windows)"
  echo "  mac        - Universal build for both Intel and Apple Silicon"
  echo "  mac-arm64  - Apple Silicon (M1/M2) only build"
  echo "  mac-x64    - Intel Mac only build"
  echo "  windows    - Windows build"
  exit 1
fi

# Function to build and release for a specific platform
build_and_release() {
  local platform=$1
  local is_latest=$2
  
  # Extract the base platform and architecture
  local base_platform=$(echo $platform | cut -d'-' -f1)
  local arch=$(echo $platform | cut -d'-' -f2)
  
  # Build the app
  echo "Building MCP Studio v$VERSION for $platform..."
  
  local build_output=""
  local release_platform=""
  
  if [ "$base_platform" == "mac" ]; then
    if [ "$platform" == "mac" ]; then
      # Universal build
      echo "Building universal macOS app (Intel + Apple Silicon)..."
      npm run build:mac-universal -- --version=$VERSION
      build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      release_platform="mac" # For the releases.json
    elif [ "$arch" == "arm64" ]; then
      echo "Building Apple Silicon (M1/M2) macOS app..."
      npm run build:mac-arm -- --version=$VERSION
      build_output="./dist/mcp-studio-mac-arm64-v$VERSION.dmg"
      release_platform="mac-arm64" # For the releases.json
    elif [ "$arch" == "x64" ]; then
      echo "Building Intel macOS app..."
      npm run build:mac-intel -- --version=$VERSION
      build_output="./dist/mcp-studio-mac-x64-v$VERSION.dmg"
      release_platform="mac-x64" # For the releases.json
    else
      echo "Error: For Mac, architecture must be not specified (universal), 'arm64', or 'x64'"
      return 1
    fi
  elif [ "$base_platform" == "windows" ]; then
    echo "Building Windows app..."
    npm run build:windows -- --version=$VERSION
    build_output="./dist/mcp-studio-windows-v$VERSION.exe"
    release_platform="windows"
  else
    echo "Error: Platform must start with 'mac' or be 'windows'"
    return 1
  fi
  
  # Check if build was successful
  if [ ! -f "$build_output" ]; then
    echo "Error: Build failed or output file not found at $build_output"
    return 1
  fi
  
  # Copy the build to the landing page releases directory
  echo "Copying build to landing page releases directory..."
  mkdir -p landing-page/public/releases
  cp "$build_output" "landing-page/public/releases/"
  
  # Update the releases.json file
  echo "Updating releases.json..."
  cd landing-page
  local latest_flag=""
  if [ "$is_latest" == "true" ]; then
    latest_flag="--latest"
  fi
  npm run update-release $VERSION $release_platform $latest_flag
  cd ..
  
  echo "✅ Successfully built and released MCP Studio v$VERSION for $platform"
  if [ "$is_latest" == "true" ]; then
    echo "✅ Set as the latest version"
  fi
  
  return 0
}

# Main execution
if [ "$PLATFORM" == "all" ]; then
  # Build for all platforms
  echo "Building for all platforms..."
  
  # Build for Mac first (and set as latest if requested)
  build_and_release "mac" $MAKE_LATEST
  MAC_SUCCESS=$?
  
  # Build for Windows (never set as latest when building all)
  build_and_release "windows" "false"
  WINDOWS_SUCCESS=$?
  
  if [ $MAC_SUCCESS -eq 0 ] && [ $WINDOWS_SUCCESS -eq 0 ]; then
    echo "✅ All builds completed successfully!"
  else
    echo "⚠️ Some builds failed. Check the logs above for details."
  fi
else
  # Build for a specific platform
  build_and_release $PLATFORM $MAKE_LATEST
fi

echo ""
echo "Next steps:"
echo "1. Test the builds locally"
echo "2. Deploy the landing page to Netlify: cd landing-page && npm run netlify-build"
echo "3. If everything looks good, commit and push your changes"
