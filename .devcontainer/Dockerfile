FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt update

# Set non-interactive mode to avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Update the package list and install necessary packages
RUN apt-get update && \
    apt-get install -y \
    mesa-utils \
    mesa-utils-extra \
    software-properties-common \
    build-essential \
    wget \
    libx11-dev \
    libxext-dev \
    libxdamage-dev \
    libxfixes-dev \
    libvulkan-dev \
    libdrm-dev \
    libgbm-dev \
    llvm-dev \
    llvm

# Install Mesa with software rendering (LLVMPipe)
RUN add-apt-repository -y ppa:kisak/kisak-mesa && \
    apt-get update && \
    apt-get install -y \
    mesa-opencl-icd \
    libgl1-mesa-dri

# Set environment variables to use LLVMPipe
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV MESA_LOADER_DRIVER_OVERRIDE=llvmpipe

RUN apt install --yes xfce4 xfce4-goodies gnome-icon-theme dbus-x11 xfce4-terminal xvfb x11vnc
# Register xfce4-terminal as an alternative for x-terminal-emulator
RUN update-alternatives --install /usr/bin/x-terminal-emulator x-terminal-emulator /usr/bin/xfce4-terminal 50
# Set xfce4-terminal as the default x-terminal-emulator
RUN update-alternatives --set x-terminal-emulator /usr/bin/xfce4-terminal

# Create and set the XDG_RUNTIME_DIR
RUN mkdir -p /tmp/runtime

# Set environment variables for the user
ENV XDG_RUNTIME_DIR=/tmp/runtime
