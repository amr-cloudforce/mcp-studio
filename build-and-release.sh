#!/bin/bash
# build-and-release.sh - Script to build MCP Studio and update the release system

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Parameters
PLATFORM=${1:-"all"}  # "all", "mac", "mac-arm64", "mac-x64", "windows"
MAKE_LATEST=${2:-false}  # Optional second parameter, defaults to false
OBFUSCATE=${3:-false}  # Optional third parameter, defaults to false

# Validate inputs
if [ -z "$PLATFORM" ]; then
  echo "Usage: ./build-and-release.sh [platform] [make_latest] [obfuscate]"
  echo "Example: ./build-and-release.sh mac true true"
  echo ""
  echo "Platforms (defaults to 'all'):"
  echo "  all        - Build for all platforms (mac and windows)"
  echo "  mac        - Universal build for both Intel and Apple Silicon"
  echo "  mac-arm64  - Apple Silicon (M1/M2) only build"
  echo "  mac-x64    - Intel Mac only build"
  echo "  windows    - Windows build"
  echo ""
  echo "Obfuscate (defaults to 'false'):"
  echo "  true       - Obfuscate code before building"
  echo "  false      - Build without obfuscation"
  exit 1
fi

echo "Building version $VERSION from package.json"

# Function to build and release for a specific platform
build_and_release() {
  local platform=$1
  local is_latest=$2
  local obfuscate=$3
  
  # Extract the base platform and architecture
  local base_platform=$(echo $platform | cut -d'-' -f1)
  local arch=$(echo $platform | cut -d'-' -f2)
  
  # Build the app
  echo "Building MCP Studio v$VERSION for $platform..."
  
  # Obfuscate code if requested
  if [ "$obfuscate" == "true" ]; then
    echo "Obfuscating code before building..."
    npm run obfuscate
    cd dist-obfuscated || exit 1
  fi
  
  local build_output=""
  local release_platform=""
  local target_filename=""
  
  if [ "$base_platform" == "mac" ]; then
    if [ "$platform" == "mac" ]; then
      # Universal build
      echo "Building universal macOS app (Intel + Apple Silicon)..."
      if [ "$obfuscate" == "true" ]; then
        npm run build:mac-universal
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      else
        npm run build:mac-universal
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      fi
      release_platform="mac" # For the releases.json
    elif [ "$arch" == "arm64" ]; then
      echo "Building Apple Silicon (M1/M2) macOS app..."
      if [ "$obfuscate" == "true" ]; then
        npm run build:mac-arm
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      else
        npm run build:mac-arm
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      fi
      release_platform="mac-arm64" # For the releases.json
      # Create architecture-specific filename for landing page
      target_filename="mcp-studio-mac-arm64-v$VERSION.dmg"
    elif [ "$arch" == "x64" ]; then
      echo "Building Intel macOS app..."
      if [ "$obfuscate" == "true" ]; then
        npm run build:mac-intel
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      else
        npm run build:mac-intel
        build_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      fi
      release_platform="mac-x64" # For the releases.json
      # Create architecture-specific filename for landing page
      target_filename="mcp-studio-mac-x64-v$VERSION.dmg"
    else
      echo "Error: For Mac, architecture must be not specified (universal), 'arm64', or 'x64'"
      return 1
    fi
  elif [ "$base_platform" == "windows" ]; then
    echo "Building Windows app..."
    if [ "$obfuscate" == "true" ]; then
      npm run build:windows
      build_output="./dist/mcp-studio-windows-v$VERSION.exe"
    else
      npm run build:windows
      build_output="./dist/mcp-studio-windows-v$VERSION.exe"
    fi
    release_platform="windows"
  else
    echo "Error: Platform must start with 'mac' or be 'windows'"
    return 1
  fi
  
  # Return to root directory if we changed to dist-obfuscated
  if [ "$obfuscate" == "true" ]; then
    cd ..
  fi
  
  # Check if build was successful
  if [ ! -f "$build_output" ]; then
    echo "Error: Build failed or output file not found at $build_output"
    echo "Checking for alternative filenames..."
    
    # Try alternative filenames
    if [ "$base_platform" == "mac" ]; then
      # Try without architecture in filename
      alt_output="./dist/mcp-studio-mac-v$VERSION.dmg"
      if [ -f "$alt_output" ]; then
        echo "Found alternative file: $alt_output"
        build_output="$alt_output"
      else
        echo "No alternative files found."
        return 1
      fi
    else
      return 1
    fi
  fi
  
  # Copy the build to the landing page releases directory
  echo "Copying build to landing page releases directory..."
  mkdir -p landing-page/public/releases
  
  # Adjust build_output path if we used obfuscation
  if [ "$obfuscate" == "true" ]; then
    build_output="./dist-obfuscated$build_output"
  fi
  
  # If we have a target filename (for architecture-specific builds), use it
  if [ -n "$target_filename" ]; then
    echo "Copying to architecture-specific filename: $target_filename"
    cp "$build_output" "landing-page/public/releases/$target_filename"
  else
    # Otherwise just copy the file as is
    echo "Copying to landing page: $build_output"
    cp "$build_output" "landing-page/public/releases/"
  fi
  
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
  build_and_release "mac" $MAKE_LATEST $OBFUSCATE
  MAC_SUCCESS=$?
  
  # Build for Windows (never set as latest when building all)
  build_and_release "windows" "false" $OBFUSCATE
  WINDOWS_SUCCESS=$?
  
  if [ $MAC_SUCCESS -eq 0 ] && [ $WINDOWS_SUCCESS -eq 0 ]; then
    echo "✅ All builds completed successfully!"
  else
    echo "⚠️ Some builds failed. Check the logs above for details."
  fi
else
  # Build for a specific platform
  build_and_release $PLATFORM $MAKE_LATEST $OBFUSCATE
fi

echo ""
echo "Next steps:"
echo "1. Test the builds locally"
echo "2. Deploy the landing page to Netlify: cd landing-page && npm run netlify-build"
echo "3. If everything looks good, commit and push your changes"

# Add note about obfuscation if it was used
if [ "$OBFUSCATE" == "true" ]; then
  echo ""
  echo "Note: This build was created with code obfuscation enabled."
  echo "The obfuscated code is in the dist-obfuscated directory."
fi
